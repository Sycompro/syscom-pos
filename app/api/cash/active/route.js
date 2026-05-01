import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.company) {
            console.warn('[API/Cash/Active] No session found, returning 401');
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const pool = await getConnection(session.user.company);
        const result = await pool.request()
            .query("SELECT TOP 1 idapecaj FROM dtl_restpos_apecaj WHERE estado = 1 ORDER BY fecape DESC");
        
        if (result.recordset.length > 0) {
            return NextResponse.json({ id: result.recordset[0].idapecaj });
        } else {
            return NextResponse.json({ id: null, message: 'No hay caja abierta' });
        }
    } catch (err) {
        console.error('[API/Cash/Active] CRITICAL ERROR:', err.message, err.stack);
        return NextResponse.json({ 
            error: 'Error en la base de datos', 
            details: err.message 
        }, { status: 500 });
    }
}
