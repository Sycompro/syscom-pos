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

export async function GET() {
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .query("SELECT TOP 1 idapecaj FROM dtl_restpos_apecaj WHERE estado = 'A' ORDER BY fecape DESC");
        
        if (result.recordset.length > 0) {
            return NextResponse.json({ id: result.recordset[0].idapecaj });
        } else {
            return NextResponse.json({ id: null, message: 'No hay caja abierta' });
        }
    } catch (err) {
        console.error('Database error:', err);
        return NextResponse.json({ error: 'Error en la base de datos' }, { status: 500 });
    }
}
