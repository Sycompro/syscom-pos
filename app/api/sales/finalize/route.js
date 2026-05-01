import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

function incrementCorrelative(current) {
    if (!current || !current.includes('-')) return current;
    const [prefix, number] = current.split('-');
    const nextNum = (parseInt(number, 10) + 1).toString().padStart(number.length, '0');
    return `${prefix}-${nextNum}`;
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const {
        docType,
        pointOfSale,
        codcli,
        items,
        idApeCaj,
        paymentMethod,
        warehouse,
        currency = 'S',
        exchangeRate = 1
    } = body;

    const pool = await getConnection(session?.user?.company);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Obtener y actualizar correlativo
        const corRes = await transaction.request()
            .input('cdocu', sql.Char(2), docType)
            .input('codpto', sql.Char(2), pointOfSale)
            .query("SELECT nroini FROM tbl01cor WHERE cdocu = @cdocu AND codpto = @codpto");

        if (corRes.recordset.length === 0) {
            throw new Error(`Correlativo no encontrado para cdocu:${docType} codpto:${pointOfSale}`);
        }

        const ndocu = corRes.recordset[0].nroini.trim();
        const nextNdocu = incrementCorrelative(ndocu);

        // 2. Calcular totales
        const totalNeto = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const totalIGV = totalNeto - (totalNeto / 1.18);
        const totalInafecto = 0; // Por ahora simplificado

        // 3. Insertar Cabecera (mst01fac)
        await transaction.request()
            .input('fecha', sql.DateTime, new Date())
            .input('cdocu', sql.Char(2), docType)
            .input('ndocu', sql.Char(12), ndocu)
            .input('codcli', sql.Char(6), codcli || '000000')
            .input('nomcli', sql.Char(60), body.nomcli || 'CLIENTE VARIOS')
            .input('ruccli', sql.Char(11), body.ruccli || '')
            .input('totn', sql.Float, totalNeto)
            .input('toti', sql.Float, totalIGV)
            .input('tota', sql.Float, totalNeto) // Total Final
            .input('mone', sql.Char(1), currency)
            .input('tcam', sql.Float, exchangeRate)
            .input('codpto', sql.Char(2), pointOfSale)
            .input('codalm', sql.Char(2), warehouse || '01')
            .input('idapecaj', sql.Int, idApeCaj)
            .input('selpago', sql.Int, paymentMethod || 1)
            .input('codtar', sql.Char(2), body.codtar || '')
            .input('codusu', sql.Char(10), session?.user?.username || 'WEB_POS')
            .query(`
                INSERT INTO mst01fac (fecha, cdocu, ndocu, codcli, nomcli, ruccli, totn, toti, tota, mone, tcam, codpto, CodAlm, idapecaj, selpago, codtar, codusu, flag, tfact)
                VALUES (@fecha, @cdocu, @ndocu, @codcli, @nomcli, @ruccli, @totn, @toti, @tota, @mone, @tcam, @codpto, @codalm, @idapecaj, @selpago, @codtar, @codusu, ' ', ' ')
            `);

        // 4. Insertar Detalle (dtl01fac) y Actualizar Stock
        const stockField = `stk${(warehouse || '01').padStart(2, '0')}`;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Insertar Detalle
            await transaction.request()
                .input('fecha', sql.DateTime, new Date())
                .input('cdocu', sql.Char(2), docType)
                .input('ndocu', sql.Char(12), ndocu)
                .input('item', sql.Int, i + 1)
                .input('codi', sql.Char(15), item.id)
                .input('descr', sql.Char(80), item.name || '')
                .input('cant', sql.Float, item.quantity)
                .input('preu', sql.Float, item.price)
                .input('tota', sql.Float, item.price * item.quantity)
                .input('codalm', sql.Char(2), warehouse || '01')
                .query(`
                    INSERT INTO dtl01fac (fecha, cdocu, ndocu, item, codi, descr, cant, preu, tota, Codalm, mone, flag)
                    VALUES (@fecha, @cdocu, @ndocu, @item, @codi, @descr, @cant, @preu, @tota, @codalm, 'S', ' ')
                `);

            // Actualizar Stock
            await transaction.request()
                .input('codi', sql.Char(15), item.id)
                .input('cant', sql.Float, item.quantity)
                .query(`UPDATE prd0101 SET ${stockField} = ${stockField} - @cant WHERE codi = @codi`);
        }

        // 5. Actualizar el correlativo para la siguiente venta
        await transaction.request()
            .input('cdocu', sql.Char(2), docType)
            .input('codpto', sql.Char(2), pointOfSale)
            .input('nextCor', sql.Char(12), nextNdocu)
            .query("UPDATE tbl01cor SET nroini = @nextCor WHERE cdocu = @cdocu AND codpto = @codpto");

        await transaction.commit();

        return NextResponse.json({
            success: true,
            message: 'Venta finalizada con éxito',
            documentNumber: ndocu
        });

    } catch (err) {
        await transaction.rollback();
        console.error('Transaction error:', err);
        return NextResponse.json({ error: 'Error al procesar la venta', details: err.message }, { status: 500 });
    }
}
