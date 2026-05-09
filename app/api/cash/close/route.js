import { NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
    try {
        const body = await request.json();
        const { idapecaj, totals } = body; 

        if (!idapecaj) {
            return NextResponse.json({ success: false, error: 'ID de apertura requerido' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const pool = await getConnection(session?.user?.company);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const now = new Date();
            const fechaStr = now.toISOString().split('T')[0];
            const tcamOficial = 3.4980; // Forzamos 4 decimales
            const codusu = session?.user?.id?.toString().padStart(3, '0').slice(0, 3) || 'POS';

            // 1. Datos de la apertura
            const apeRes = await transaction.request()
                .input('id', sql.Int, idapecaj)
                .query('SELECT codpto, nropla, fecape FROM dtl_restpos_apecaj WHERE idapecaj = @id');
            
            if (apeRes.recordset.length === 0) throw new Error("No se encontró la apertura");
            const { codpto: erpPto, nropla: erpNroPla, fecape } = apeRes.recordset[0];
            const planillaOficial = erpNroPla.trim().substring(0, 12);

            // 2. Control Interno (Arqueo)
            // Calculamos el siguiente ID de Arqueo para esta sesión
            const lastArqueoRes = await transaction.request()
                .input('idapecaj', sql.Int, idapecaj)
                .query('SELECT ISNULL(MAX(idarqueo), 0) + 1 as nextId FROM dtl_restpos_arqueo WHERE idapecaj = @idapecaj');
            const nextIdArqueo = lastArqueoRes.recordset[0].nextId;

            for (let i = 0; i < totals.length; i++) {
                const item = totals[i];
                await transaction.request()
                    .input('idapecaj', sql.Int, idapecaj)
                    .input('idarqueo', sql.Int, nextIdArqueo)
                    .input('selpago', sql.Int, item.selpago)
                    .input('codtar', sql.Char(2), (item.codtar || '  ').substring(0, 2))
                    .input('fecha', sql.DateTime, now)
                    .input('codusu', sql.Char(3), codusu.substring(0, 3))
                    .input('totnfis', sql.Decimal(18, 4), Number((item.totnfis || item.totnsis).toFixed(2)))
                    .input('totnsis', sql.Decimal(18, 4), Number(item.totnsis.toFixed(2)))
                    .query(`
                        INSERT INTO dtl_restpos_arqueo (idapecaj, idarqueo, selpago, codtar, fecha, codusu, totnfis, totnsis, obser)
                        VALUES (@idapecaj, @idarqueo, @selpago, @codtar, @fecha, @codusu, @totnfis, @totnsis, '')
                    `);
            }

            // 3. CONSOLIDACIÓN PERFECTA (RIC 38)
            const salesRes = await transaction.request()
                .input('id', sql.Int, idapecaj)
                .query(`
                    SELECT ndocu, cdocu, totn, codcli, nomcli, codven, cpago, selpago
                    FROM mst01fac 
                    WHERE idapecaj = @id AND estado <> 'V'
                `);

            if (salesRes.recordset.length > 0) {
                const totalMonto = salesRes.recordset.reduce((acc, curr) => acc + curr.totn, 0);
                const totalMontoRed = Number(totalMonto.toFixed(2));
                
                // Correlativo Oficial
                const corRes = await transaction.request()
                    .input('cdocu', '38').input('codpto', erpPto)
                    .query(`SELECT nroini FROM tbl01cor WHERE cdocu = @cdocu AND codpto = @codpto`);

                let nroRIC;
                if (corRes.recordset[0]) {
                    const currentNro = corRes.recordset[0].nroini.trim();
                    const parts = currentNro.split('-');
                    const series = parts[0];
                    const numPart = (parts[1] || parts[0]).replace(/[^0-9]/g, '');
                    const nextNum = (parseInt(numPart, 10) + 1).toString().padStart(numPart.length, '0');
                    nroRIC = `${series}-${nextNum}`.substring(0, 12);

                    await transaction.request()
                        .input('nextNro', nroRIC).input('cdocu', '38').input('codpto', erpPto)
                        .query(`UPDATE tbl01cor SET nroini = @nextNro WHERE cdocu = @cdocu AND codpto = @codpto`);
                } else {
                    nroRIC = `R${erpPto}-${idapecaj.toString().padStart(7, '0')}`.substring(0, 12);
                }

                // A. Cabecera Maestra (mst01cob)
                const glosaOficial = `VTA.CONT.${new Date(fecape).toLocaleDateString('es-PE')} PTO: ${erpPto}`.substring(0, 50);
                await transaction.request()
                    .input('cdocu', '38').input('ndocu', nroRIC)
                    .input('crefe', '38').input('nrefe', nroRIC)
                    .input('fecha', sql.Date, fechaStr)
                    .input('tmov', 'I').input('glosa', glosaOficial)
                    .input('codcli', 'C00000').input('nomcli', 'VENTA CONSOLIDADA POS')
                    .input('monto', sql.Decimal(18, 4), totalMontoRed)
                    .input('mone', 'S').input('tcam', sql.Decimal(18, 4), tcamOficial)
                    .input('flag', '1').input('codven', 'V0001')
                    .input('Codpto', erpPto).input('idapecaj_real', sql.Int, idapecaj)
                    .input('cpago', 'E').input('selpago', sql.Int, 1)
                    .input('nplan', planillaOficial).input('codcaj', '01')
                    .input('fCierre', sql.DateTime, now)
                    .query(`
                        INSERT INTO mst01cob (cdocu, ndocu, crefe, nrefe, fecha, tmov, glosa, codcli, nomcli, monto, mone, tcam, flag, codven, Codpto, idapecaj, cpago, selpago, nplan, codcaj, fecreg, fCierre)
                        VALUES (@cdocu, @ndocu, @crefe, @nrefe, @fecha, @tmov, @glosa, @codcli, @nomcli, @monto, @mone, @tcam, @flag, @codven, @Codpto, 0, @cpago, @selpago, @nplan, @codcaj, GETDATE(), @fCierre)
                    `);

                // B. Detalles (dtl01cob y abonos dtl01ccc)
                for (const sale of salesRes.recordset) {
                    const montoSaleRed = Number(sale.totn.toFixed(2));
                    const codPago = sale.selpago === 1 ? 'E' : 'T';
                    const codBanco = sale.selpago === 1 ? '  ' : '01';

                    await transaction.request()
                        .input('cdocu', '38').input('ndocu', nroRIC)
                        .input('crefe', sale.cdocu.substring(0, 2)).input('nrefe', sale.ndocu.substring(0, 12))
                        .input('monto', sql.Decimal(18, 4), montoSaleRed)
                        .input('mone', 'S').input('tcam', sql.Decimal(18, 4), tcamOficial)
                        .input('cpago', codPago).input('codbco', codBanco)
                        .input('codven', sale.codven).input('nplan', planillaOficial)
                        .input('valori', sql.Decimal(18, 4), montoSaleRed).input('monori', 'S')
                        .query(`
                            INSERT INTO dtl01cob (cdocu, ndocu, crefe, nrefe, monto, cpago, npago, mone, tcam, codbco, codven, nplan, valori, monori, mtopad, mtopas, codn, impdonac)
                            VALUES (@cdocu, @ndocu, @crefe, @nrefe, @monto, @cpago, '             ', @mone, @tcam, @codbco, @codven, @nplan, @valori, @monori, 0, @monto, '      ', 0)
                        `);

                    await transaction.request()
                        .input('fecha', sql.Date, fechaStr).input('codcli', sale.codcli)
                        .input('cdocu', '38').input('ndocu', nroRIC)
                        .input('crefe', sale.cdocu.substring(0, 2)).input('nrefe', sale.ndocu.substring(0, 12))
                        .input('glosa', `CANJE VENTA ${sale.ndocu.substring(0, 12)}`)
                        .input('abono', sql.Decimal(18, 4), montoSaleRed)
                        .input('tcam', sql.Decimal(18, 4), tcamOficial)
                        .input('nplan', planillaOficial)
                        .query(`
                            INSERT INTO dtl01ccc (fecha, codcli, tmov, cdocu, ndocu, crefe, nrefe, glosa, cargo, abono, mone, tcam, cpago, mpago, npago, ipago, nplan, idunico, fecreg, compro)
                            VALUES (@fecha, @codcli, 'A', @cdocu, @ndocu, @crefe, @nrefe, @glosa, 0, @abono, 'S', @tcam, ' ', ' ', '            ', 0, @nplan, NEWID(), GETDATE(), '03/      ')
                        `);
                }
            }

            // 4. Finalización
            await transaction.request()
                .input('id', sql.Int, idapecaj).input('feccie', sql.DateTime, now)
                .query('UPDATE dtl_restpos_apecaj SET estado = 1, feccie = @feccie WHERE idapecaj = @id');

            if (erpPto) {
                await transaction.request().input('codpto', sql.Char(10), erpPto)
                    .query(`UPDATE tbl01pto SET estado = 1, apecaj = 0, apecajsol = 0, apecajdol = 0, apecajeur = 0, apecajusu = '   ', apecajtur = '  ' WHERE LTRIM(RTRIM(codpto)) = LTRIM(RTRIM(@codpto))`);
            }

            await transaction.commit();
            return NextResponse.json({ success: true });

        } catch (err) {
            console.error('Transaction Error:', err);
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Error in cash close API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
