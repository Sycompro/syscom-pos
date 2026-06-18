import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const pool = await getConnection(session.user.company);
        
        // Consultar todos los egresos / gastos de caja
        const result = await pool.request()
            .query(`
                SELECT 
                    e.fecha, 
                    e.hora, 
                    e.codpto, 
                    e.concepto, 
                    e.monto, 
                    e.nroctacte, 
                    e.idapecaj, 
                    e.codmotivo,
                    LTRIM(RTRIM(m.motivo)) as desmotivo
                FROM dtl_restpos_egrcaja e
                LEFT JOIN tblrestpos_motegrcaja m ON LTRIM(RTRIM(e.codmotivo)) = LTRIM(RTRIM(m.codmotivo))
                ORDER BY e.fecha DESC, e.hora DESC
            `);
            
        return NextResponse.json({ success: true, list: result.recordset });
    } catch (error) {
        console.error('[API/Cash/Expenses/List] Error:', error.message);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
