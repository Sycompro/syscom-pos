import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
    let pool;
    let transaction;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { codcli, cdocu_ref, ndocu_ref, amount, paymentMethod, idApeCaj } = body;

        if (!codcli || !cdocu_ref || !ndocu_ref || amount === undefined || !paymentMethod || !idApeCaj) {
            return NextResponse.json({ 
                error: 'Faltan parámetros obligatorios (codcli, cdocu_ref, ndocu_ref, amount, paymentMethod, idApeCaj)' 
            }, { status: 400 });
        }

        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return NextResponse.json({ error: 'El monto a amortizar debe ser un número mayor a 0' }, { status: 400 });
        }

        pool = await getConnection(session.user.company);

        // 1. Obtener datos de la apertura de caja
        const resApe = await pool.request()
            .input('idapecaj', sql.Int, idApeCaj)
            .query(`
                SELECT a.nropla, a.codpto, a.codusu
                FROM dtl_restpos_apecaj a 
                WHERE a.idapecaj = @idapecaj
            `);

        if (resApe.recordset.length === 0) {
            return NextResponse.json({ error: `Sesión de caja no encontrada: ${idApeCaj}` }, { status: 404 });
        }

        const { nropla, codpto, codusu } = resApe.recordset[0];
        const cleanCodpto = codpto.trim();
        const cleanCodusu = codusu.trim();

        // 2. Obtener datos del cliente
        const resCli = await pool.request()
            .input('codcli', sql.Char(6), codcli)
            .query(`SELECT nomcli, codven FROM mst01cli WHERE codcli = @codcli`);

        if (resCli.recordset.length === 0) {
            return NextResponse.json({ error: `Cliente no encontrado: ${codcli}` }, { status: 404 });
        }

        const { nomcli, codven } = resCli.recordset[0];
        const cleanNomcli = nomcli.trim();
        const finalCodVen = (codven || 'V0001').trim();

        // 3. Obtener el tipo de cambio del día o más reciente
        const resTca = await pool.request().query(`
            SELECT TOP 1 tcvta 
            FROM tbl01tca 
            WHERE tcvta > 0 AND fecha <= GETDATE() 
            ORDER BY fecha DESC
        `);
        const tcam_vta = resTca.recordset.length > 0 ? Number(resTca.recordset[0].tcvta) : 3.40;

        // 4. Formatear fechas
        const now = new Date();
        const peruvianDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Lima',
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(now);
        const fechaStr = peruvianDate; // YYYY-MM-DD

        const isCash = (paymentMethod === 'EF' || paymentMethod === 'Efectivo');
        const finalCodbco = (isCash || paymentMethod === 'Tarjeta') ? '  ' : paymentMethod.substring(0, 2);
        const finalCpago = isCash ? 'E' : 'T';
        const finalSelpago = isCash ? 1 : 3;
        const finalCajrecib = isCash ? numericAmount : 0.00;

        // Iniciar transacción SQL para garantizar atomicidad
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // A. Obtener y actualizar el correlativo para recibo de ingreso ('38') en el punto de venta
        const requestCor = new sql.Request(transaction);
        const resCor = await requestCor
            .input('cdocu', '38')
            .input('codpto', cleanCodpto)
            .query(`SELECT nroini FROM tbl01cor WHERE cdocu = @cdocu AND codpto = @codpto`);

        if (resCor.recordset.length === 0) {
            throw new Error(`Sin correlativo configurado para recibos de ingreso (38) en el punto de venta ${cleanCodpto}`);
        }

        const currentNroIni = resCor.recordset[0].nroini.trim();
        const parts = currentNroIni.split('-');
        const series = parts[0];
        const numPartClean = (parts[1] || parts[0]).replace(/[^0-9]/g, '');
        const nextNum = (parseInt(numPartClean, 10) + 1).toString().padStart(numPartClean.length, '0');
        const nextNdocu = `${series}-${nextNum}`;

        // Actualizar el correlativo
        await requestCor
            .input('nextNdocu', nextNdocu)
            .query(`UPDATE tbl01cor SET nroini = @nextNdocu WHERE cdocu = @cdocu AND codpto = @codpto`);

        const displayGlosa = `AMORT. DOC ${cdocu_ref.trim()}-${ndocu_ref.trim()} / ${cleanNomcli}`.substring(0, 100);
        const formattedCompro = `38/${nextNdocu.substring(nextNdocu.length - 6)}`;

        // B. Insertar cabecera en mst01cob
        const reqMstCob = new sql.Request(transaction);
        await reqMstCob
            .input('cdocu', '38')
            .input('ndocu', nextNdocu.substring(0, 12))
            .input('crefe', '38')
            .input('nrefe', nextNdocu.substring(0, 12))
            .input('fecha', sql.Date, fechaStr)
            .input('tmov', 'I')
            .input('glosa', sql.VarChar(100), displayGlosa)
            .input('codcli', sql.Char(6), codcli)
            .input('nomcli', sql.VarChar(60), cleanNomcli.substring(0, 60))
            .input('monto', sql.Decimal(18, 2), numericAmount)
            .input('cpago', finalCpago)
            .input('npago', sql.Char(12), nextNdocu.substring(0, 12))
            .input('mone', 'S')
            .input('tcam', sql.Decimal(18, 4), tcam_vta)
            .input('tcheq', 'N')
            .input('codbco', finalCodbco)
            .input('nrocta', '               ')
            .input('flag', '1')
            .input('codven', sql.Char(5), finalCodVen.substring(0, 5))
            .input('codcob', sql.Char(5), finalCodVen.substring(0, 5))
            .input('codcdv', '01')
            .input('nplan', '            ')
            .input('fven', sql.Date, fechaStr)
            .input('pdep', '            ')
            .input('bdep', '  ')
            .input('cdep', '               ')
            .input('flagc', 'C')
            .input('compro', '         ')
            .input('nrorol', '            ')
            .input('codpto', cleanCodpto)
            .input('flaganu', 0)
            .input('codsub', '00')
            .input('NumPre', '            ')
            .input('codglv', '000')
            .input('flagdep', '0')
            .input('observa', '')
            .input('nplaning', '            ')
            .input('codcaj', '01')
            .input('impdonac', 0.00)
            .input('codmot', '  ')
            .input('idapecaj', sql.Int, idApeCaj)
            .input('selpago', finalSelpago)
            .input('cobmixta', 0)
            .input('cajrecib', sql.Decimal(18, 2), finalCajrecib)
            .input('monrecib', 'S')
            .input('cajvuelto', 0.00)
            .input('monvuelto', 'S')
            .input('percep', 0)
            .input('impper', 0.00)
            .input('Vb_Conta', 0)
            .input('nroret', '            ')
            .input('impret', 0.00)
            .query(`
                INSERT INTO mst01cob (
                    cdocu, ndocu, crefe, nrefe, fecha, tmov, glosa, codcli, nomcli, monto, cpago, npago, mone, tcam,
                    tcheq, codbco, nrocta, flag, codven, codcob, codcdv, nplan, fven, pdep, bdep, cdep, flagc, compro,
                    nrorol, fCierre, codpto, flaganu, codsub, NumPre, codglv, flagdep, observa, nplaning, codcaj,
                    impdonac, codmot, idapecaj, selpago, cobmixta, cajrecib, monrecib, cajvuelto, monvuelto, percep,
                    impper, Vb_Conta, fecreg, nroret, impret
                ) VALUES (
                    @cdocu, @ndocu, @crefe, @nrefe, @fecha, @tmov, @glosa, @codcli, @nomcli, @monto, @cpago, @npago, @mone, @tcam,
                    @tcheq, @codbco, @nrocta, @flag, @codven, @codcob, @codcdv, @nplan, @fven, @pdep, @bdep, @cdep, @flagc, @compro,
                    @nrorol, GETDATE(), @codpto, @flaganu, @codsub, @NumPre, @codglv, @flagdep, @observa, @nplaning, @codcaj,
                    @impdonac, @codmot, @idapecaj, @selpago, @cobmixta, @cajrecib, @monrecib, @cajvuelto, @monvuelto, @percep,
                    @impper, @Vb_Conta, GETDATE(), @nroret, @impret
                )
            `);

        // C. Insertar detalle en dtl01cob
        const reqDtlCob = new sql.Request(transaction);
        await reqDtlCob
            .input('cdocu', '38')
            .input('ndocu', nextNdocu.substring(0, 12))
            .input('crefe', cdocu_ref.substring(0, 2))
            .input('nrefe', ndocu_ref.substring(0, 12))
            .input('monto', sql.Decimal(18, 2), numericAmount)
            .input('cpago', finalCpago)
            .input('npago', '            ')
            .input('mone', 'S')
            .input('tcam', sql.Decimal(18, 4), tcam_vta)
            .input('codbco', finalCodbco)
            .input('codven', sql.Char(5), finalCodVen.substring(0, 5))
            .input('nplan', '            ')
            .input('valori', sql.Decimal(18, 2), numericAmount)
            .input('monori', 'S')
            .input('mtopad', 0.00)
            .input('mtopas', 0.00)
            .input('codn', sql.Char(6), codcli)
            .input('impdonac', 0.00)
            .query(`
                INSERT INTO dtl01cob (
                    cdocu, ndocu, crefe, nrefe, monto, cpago, npago, mone, tcam, codbco, codven, nplan, valori, monori,
                    mtopad, mtopas, codn, impdonac
                ) VALUES (
                    @cdocu, @ndocu, @crefe, @nrefe, @monto, @cpago, @npago, @mone, @tcam, @codbco, @codven, @nplan, @valori, @monori,
                    @mtopad, @mtopas, @codn, @impdonac
                )
            `);

        // D. Rebajar saldo en cuenta corriente (mst01ccc)
        const reqMstCcc = new sql.Request(transaction);
        const resUpdateCcc = await reqMstCcc
            .input('codcli', sql.Char(6), codcli)
            .input('cdocu', cdocu_ref.substring(0, 2))
            .input('ndocu', ndocu_ref.substring(0, 12))
            .input('amount', sql.Decimal(18, 2), numericAmount)
            .query(`
                UPDATE mst01ccc 
                SET saldo = saldo - @amount 
                WHERE codcli = @codcli AND cdocu = @cdocu AND ndocu = @ndocu;
                
                SELECT saldo FROM mst01ccc WHERE codcli = @codcli AND cdocu = @cdocu AND ndocu = @ndocu;
            `);

        if (resUpdateCcc.recordset.length === 0) {
            throw new Error(`No se pudo actualizar el comprobante ${cdocu_ref}-${ndocu_ref} en mst01ccc.`);
        }

        const newSaldo = Number(resUpdateCcc.recordset[0].saldo) || 0;

        // Si el saldo es menor o igual a 0, marcar el flag como '1' (Cancelado)
        if (newSaldo <= 0.02) { // Tolerancia para diferencias menores por redondeo
            await reqMstCcc
                .query(`
                    UPDATE mst01ccc 
                    SET flag = '1', uabo = GETDATE(), saldo = 0 
                    WHERE codcli = @codcli AND cdocu = @cdocu AND ndocu = @ndocu
                `);
        }

        // E. Insertar abono en dtl01ccc (Kardex de cobranzas para consistencia)
        const reqDtlCcc = new sql.Request(transaction);
        await reqDtlCcc
            .input('fecha', sql.Date, fechaStr)
            .input('codcli', sql.Char(6), codcli)
            .input('cdocu', '38')
            .input('ndocu', nextNdocu.substring(0, 12))
            .input('crefe', cdocu_ref.substring(0, 2))
            .input('nrefe', ndocu_ref.substring(0, 12))
            .input('glosa', sql.VarChar(100), displayGlosa)
            .input('abono', sql.Decimal(18, 2), numericAmount)
            .input('mone', 'S')
            .input('tcam', sql.Decimal(18, 4), tcam_vta)
            .input('cpago', finalCpago)
            .input('compro', formattedCompro)
            .query(`
                INSERT INTO dtl01ccc (
                    fecha, codcli, tmov, cdocu, ndocu, crefe, nrefe, glosa, cargo, abono, mone, tcam, cpago, mpago,
                    npago, ipago, nplan, idunico, fecreg, compro
                ) VALUES (
                    @fecha, @codcli, 'A', @cdocu, @ndocu, @crefe, @nrefe, @glosa, 0, @abono, @mone, @tcam, @cpago, ' ',
                    '            ', 0, '            ', NEWID(), GETDATE(), @compro
                )
            `);

        // Finalizar y confirmar
        await transaction.commit();

        return NextResponse.json({
            success: true,
            message: 'Cobro de deuda registrado exitosamente',
            data: {
                receiptNumber: nextNdocu,
                newSaldo: Math.max(0, newSaldo - numericAmount)
            }
        });

    } catch (err) {
        console.error('[API/Sales/Collect] Error:', err);
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollErr) {
                console.error('[API/Sales/Collect] Error durante rollback:', rollErr.message);
            }
        }
        return NextResponse.json({ 
            success: false, 
            error: 'Error al registrar el cobro de la deuda',
            details: err.message 
        }, { status: 500 });
    }
}
