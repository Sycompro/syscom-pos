import { NextResponse } from 'next/server';
import sql from 'mssql';

const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const warehouse = searchParams.get('alm') || '01'; // Default warehouse

    if (!query) {
        return NextResponse.json({ error: 'Falta parámetro de búsqueda' }, { status: 400 });
    }

    try {
        const pool = await sql.connect(sqlConfig);
        
        // El stock campo depende del almacén (stk01, stk02, etc)
        const stockField = `stk${warehouse.padStart(2, '0')}`;
        
        const result = await pool.request()
            .input('search', sql.VarChar, `%${query}%`)
            .query(`
                SELECT TOP 50 
                    codi as id, 
                    descr as name, 
                    marc as brand, 
                    pvns as price, 
                    ${stockField} as stock,
                    umed as unit
                FROM prd0101 
                WHERE (descr LIKE @search OR codi LIKE @search)
                AND estado = 1
                ORDER BY descr
            `);

        return NextResponse.json(result.recordset);
    } catch (err) {
        console.error('Database error:', err);
        return NextResponse.json({ error: 'Error en la base de datos', details: err.message }, { status: 500 });
    }
}
