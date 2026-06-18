import { NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const pool = await getConnection(session.user.company);
        
        // Obtener historial de aperturas de caja
        const result = await pool.request()
            .query(`
                SELECT 
                    a.idapecaj, 
                    a.fecape, 
                    a.hora, 
                    a.codpto, 
                    a.codusu, 
                    a.estado, 
                    a.apesol, 
                    a.apedol, 
                    a.apeeur, 
                    a.feccie,
                    LTRIM(RTRIM(v.nomven)) as nomusuario
                FROM dtl_restpos_apecaj a
                LEFT JOIN tbl01ven v ON LTRIM(RTRIM(a.codusu)) = LTRIM(RTRIM(v.codven))
                ORDER BY a.idapecaj DESC
            `);
            
        return NextResponse.json({ success: true, list: result.recordset });
    } catch (error) {
        console.error('[API/Cash/List] Error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
