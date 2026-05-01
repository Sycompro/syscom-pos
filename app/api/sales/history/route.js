import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('date', sql.Date, date)
            .query(`
                SELECT 
                    ndocu as id, 
                    cdocu, 
                    fecha, 
                    nomcli as client, 
                    tota as total, 
                    flag,
                    CASE WHEN flag = '*' THEN 'Anulado' ELSE 'Activo' END as status
                FROM mst01fac 
                WHERE CAST(fecha as date) = @date
                ORDER BY fecha DESC
            `);

        return NextResponse.json(result.recordset);
    } catch (err) {
        console.error('History error:', err);
        return NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 });
    }
}
