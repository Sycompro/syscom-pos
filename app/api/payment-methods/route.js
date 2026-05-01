import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.company) {
            console.warn('[API/PaymentMethods] No session found');
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const pool = await getConnection(session.user.company);
        
        // Verificamos si la tabla existe antes de consultar
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
        console.error('[API/PaymentMethods] CRITICAL ERROR:', err.message);
        return NextResponse.json({ 
            error: 'Error al obtener métodos de pago',
            details: err.message
        }, { status: 500 });
    }
}
