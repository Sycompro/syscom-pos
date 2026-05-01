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

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const cdocu = searchParams.get('cdocu');
    const ndocu = searchParams.get('ndocu');

    if (!cdocu || !ndocu) {
        return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    try {
        const pool = await sql.connect(sqlConfig);
        
        const result = await pool.request()
            .input('cdocu', sql.Char(2), cdocu)
            .input('ndocu', sql.Char(12), ndocu)
            .query(`
                SELECT d.codi, d.nomb as name, d.cant as quantity, d.prec as price, d.totn as total
                FROM dtl01fac d
                WHERE d.cdocu = @cdocu AND d.ndocu = @ndocu
            `);

        return NextResponse.json(result.recordset);

    } catch (err) {
        console.error('Sales details error:', err);
        return NextResponse.json({ error: 'Error al obtener detalles' }, { status: 500 });
    }
}
