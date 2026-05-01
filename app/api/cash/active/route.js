import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const pool = await getConnection(session?.user?.company);
        const result = await pool.request()
            .query("SELECT TOP 1 idapecaj FROM dtl_restpos_apecaj WHERE estado = 1 ORDER BY fecape DESC");
        
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
