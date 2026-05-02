import { NextResponse } from 'next/server';
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
        
        // 1. Intentar con Esquema ERP (dtl_restpos_apecaj)
        try {
            const userCode = session.user.id?.toString().trim(); // codusu
            const sedeCode = session.user.sedeId?.toString().trim(); // codpto

            console.log(`[API/Cash/Active] Buscando caja para Usuario: [${userCode}] Sede: [${sedeCode}]`);

            const result = await pool.request()
                .input('codusu', userCode)
                .input('codpto', sedeCode)
                .query("SELECT TOP 1 idapecaj as id FROM dtl_restpos_apecaj WHERE estado = 0 AND LTRIM(RTRIM(codusu)) = @codusu AND LTRIM(RTRIM(codpto)) = @codpto ORDER BY idapecaj DESC");
            
            if (result.recordset.length > 0) {
                console.log(`[API/Cash/Active] ¡Caja encontrada! ID: ${result.recordset[0].id}`);
                return NextResponse.json({ id: result.recordset[0].id });
            }
        } catch (e) {
            console.error("[API/Cash/Active] Error consultando dtl_restpos_apecaj:", e.message);
        }

        // 2. Intentar con Esquema POS (Caja)
        try {
            const result = await pool.request()
                .query("SELECT TOP 1 CajaId as id FROM Caja WHERE Vigente = 1 ORDER BY FechaApertura DESC");
            
            if (result.recordset.length > 0) {
                return NextResponse.json({ id: result.recordset[0].id });
            }
        } catch (e) {
            console.error("[API/Cash/Active] Ningún esquema de caja válido encontrado");
        }
        
        return NextResponse.json({ id: null, message: 'No hay caja abierta' });

    } catch (err) {
        console.error('[API/Cash/Active] CRITICAL ERROR:', err.message);
        return NextResponse.json({ 
            error: 'Error en la base de datos', 
            details: err.message 
        }, { status: 500 });
    }
}
