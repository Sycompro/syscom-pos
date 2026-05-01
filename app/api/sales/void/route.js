import { NextResponse } from 'next/server';
import sql from 'mssql';

const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

export async function POST(request) {
    const body = await request.json();
    const { cdocu, ndocu } = body;

    if (!cdocu || !ndocu) {
        return NextResponse.json({ error: 'Faltan datos del documento' }, { status: 400 });
    }

    const pool = await sql.connect(sqlConfig);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Verificar estado actual
        const checkRes = await transaction.request()
            .input('cdocu', sql.Char(2), cdocu)
            .input('ndocu', sql.Char(12), ndocu)
            .query("SELECT flag, CodAlm FROM mst01fac WHERE cdocu = @cdocu AND ndocu = @ndocu");

        if (checkRes.recordset.length === 0) {
            throw new Error('Documento no encontrado');
        }

        if (checkRes.recordset[0].flag === '*') {
            throw new Error('El documento ya está anulado');
        }

        const warehouse = checkRes.recordset[0].CodAlm.trim();
        const stockField = `stk${warehouse.padStart(2, '0')}`;

        // 2. Anular Cabecera y Detalle
        await transaction.request()
            .input('cdocu', sql.Char(2), cdocu)
            .input('ndocu', sql.Char(12), ndocu)
            .query("UPDATE mst01fac SET flag = '*' WHERE cdocu = @cdocu AND ndocu = @ndocu");

        await transaction.request()
            .input('cdocu', sql.Char(2), cdocu)
            .input('ndocu', sql.Char(12), ndocu)
            .query("UPDATE dtl01fac SET flag = '*' WHERE cdocu = @cdocu AND ndocu = @ndocu");

        // 3. Devolver Stock
        const itemsRes = await transaction.request()
            .input('cdocu', sql.Char(2), cdocu)
            .input('ndocu', sql.Char(12), ndocu)
            .query("SELECT codi, cant FROM dtl01fac WHERE cdocu = @cdocu AND ndocu = @ndocu");

        for (const item of itemsRes.recordset) {
            await transaction.request()
                .input('codi', sql.Char(15), item.codi)
                .input('cant', sql.Float, item.cant)
                .query(`UPDATE prd0101 SET ${stockField} = ${stockField} + @cant WHERE codi = @codi`);
        }

        await transaction.commit();

        return NextResponse.json({ success: true, message: 'Documento anulado correctamente' });

    } catch (err) {
        await transaction.rollback();
        console.error('Void error:', err);
        return NextResponse.json({ error: 'Error al anular', details: err.message }, { status: 500 });
    }
}
