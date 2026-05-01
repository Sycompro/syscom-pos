import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .query("SELECT codtar as id, nomtar as name FROM tbl01tar WHERE flag = 1");

        const methods = [
            { id: 'EF', name: 'EFECTIVO', type: 1 },
            ...(result.recordset || []).map(r => ({ 
                id: (r.id || '').toString().trim(), 
                name: (r.name || '').toString().trim(), 
                type: 3 
            }))
        ];

        return NextResponse.json(methods);

    } catch (err) {
        console.error('Payment methods error:', err);
        return NextResponse.json({ error: 'Error al obtener métodos de pago' }, { status: 500 });
    }
}
