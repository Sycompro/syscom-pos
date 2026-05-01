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
    const idApeCaj = searchParams.get('id');

    if (!idApeCaj) {
        return NextResponse.json({ error: 'Falta ID de apertura' }, { status: 400 });
    }

    try {
        const pool = await sql.connect(sqlConfig);
        
        // 1. Obtener datos de apertura
        const sessionRes = await pool.request()
            .input('id', sql.Int, idApeCaj)
            .query("SELECT * FROM dtl_restpos_apecaj WHERE idapecaj = @id");

        if (sessionRes.recordset.length === 0) {
            throw new Error('Sesión de caja no encontrada');
        }

        const session = sessionRes.recordset[0];

        // 2. Calcular ventas por método de pago
        const salesRes = await pool.request()
            .input('id', sql.Int, idApeCaj)
            .query(`
                SELECT 
                    selpago,
                    SUM(tota) as total,
                    COUNT(*) as qty
                FROM mst01fac
                WHERE idapecaj = @id AND flag <> '*'
                GROUP BY selpago
            `);

        // 3. Contar anulados
        const voidRes = await pool.request()
            .input('id', sql.Int, idApeCaj)
            .query("SELECT SUM(tota) as total, COUNT(*) as qty FROM mst01fac WHERE idapecaj = @id AND flag = '*'");

        // Formatear resultados
        const summary = {
            openingBalance: session.apesol,
            cash: 0,
            card: 0,
            credit: 0,
            others: 0,
            voidedTotal: voidRes.recordset[0].total || 0,
            voidedQty: voidRes.recordset[0].qty || 0,
            totalSales: 0
        };

        salesRes.recordset.forEach(row => {
            summary.totalSales += row.total;
            if (row.selpago === 1) summary.cash = row.total;
            else if (row.selpago === 3) summary.card = row.total;
            else if (row.selpago === 5) summary.credit = row.total;
            else summary.others += row.total;
        });

        return NextResponse.json({
            session: {
                id: session.idapecaj,
                start: session.fecape,
                status: session.estado === 1 ? 'ABIERTA' : 'CERRADA'
            },
            summary
        });

    } catch (err) {
        console.error('Cash summary error:', err);
        return NextResponse.json({ error: 'Error al obtener resumen', details: err.message }, { status: 500 });
    }
}
