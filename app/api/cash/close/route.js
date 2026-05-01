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
    const { id } = body;

    if (!id) {
        return NextResponse.json({ error: 'Falta ID de apertura' }, { status: 400 });
    }

    try {
        const pool = await sql.connect(sqlConfig);
        
        // 1. Verificar que esté abierta
        const check = await pool.request()
            .input('id', sql.Int, id)
            .query("SELECT estado FROM dtl_restpos_apecaj WHERE idapecaj = @id");

        if (check.recordset.length === 0) throw new Error('Caja no encontrada');
        if (check.recordset[0].estado === 0) throw new Error('La caja ya está cerrada');

        // 2. Cerrar la caja
        await pool.request()
            .input('id', sql.Int, id)
            .query("UPDATE dtl_restpos_apecaj SET estado = 0, feccie = GETDATE() WHERE idapecaj = @id");

        return NextResponse.json({ success: true, message: 'Caja cerrada correctamente' });

    } catch (err) {
        console.error('Cash close error:', err);
        return NextResponse.json({ error: 'Error al cerrar caja', details: err.message }, { status: 500 });
    }
}
