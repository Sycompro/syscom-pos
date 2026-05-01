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
    const date = searchParams.get('date'); // Format YYYY-MM-DD

    try {
        const pool = await sql.connect(sqlConfig);
        
        let query = `
            SELECT TOP 50 
                m.fecha, m.cdocu, m.ndocu, m.nomcli, m.ruccli, m.tota, m.flag, m.mone, m.idapecaj,
                (SELECT COUNT(*) FROM dtl01fac d WHERE d.cdocu = m.cdocu AND d.ndocu = m.ndocu) as items
            FROM mst01fac m
            WHERE 1=1
        `;

        if (date) {
            query += ` AND CAST(m.fecha AS DATE) = @date`;
        }

        query += ` ORDER BY m.fecha DESC, m.ndocu DESC`;

        const requestSql = pool.request();
        if (date) requestSql.input('date', sql.Date, date);

        const result = await requestSql.query(query);

        return NextResponse.json(result.recordset);

    } catch (err) {
        console.error('Sales history error:', err);
        return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
    }
}
