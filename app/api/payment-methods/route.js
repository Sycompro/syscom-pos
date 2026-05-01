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
            .query("SELECT codtar as id, nomtar as name FROM tbl01tar WHERE flag = 1");

        const methods = [
            { id: 'EF', name: 'EFECTIVO', type: 1 },
            ...result.recordset.map(r => ({ id: r.id.trim(), name: r.name.trim(), type: 3 }))
        ];

        return NextResponse.json(methods);

    } catch (err) {
        console.error('Payment methods error:', err);
        return NextResponse.json({ error: 'Error al obtener métodos de pago' }, { status: 500 });
    }
}
