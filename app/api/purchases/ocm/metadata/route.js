import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getConnection } from "@/lib/db";
import logger from "@/lib/logger";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const pool = await getConnection(session.user.company);
        
        // Obtener condiciones de pago de tbl01cdv
        const condResult = await pool.request().query(`
            SELECT LTRIM(RTRIM(codcdv)) as codcdv, LTRIM(RTRIM(nomcdv)) as nomcdv 
            FROM tbl01cdv WITH(nolock) 
            ORDER BY codcdv
        `);

        // Obtener clasificaciones de OCM de tbl01Coc
        const cocResult = await pool.request().query(`
            SELECT LTRIM(RTRIM(codcoc)) as codcoc, LTRIM(RTRIM(Nomcoc)) as nomcoc 
            FROM tbl01Coc WITH(nolock) 
            ORDER BY codcoc
        `);

        return NextResponse.json({
            success: true,
            conditions: condResult.recordset,
            classifications: cocResult.recordset
        });

    } catch (err) {
        logger.error(`[API/Purchases/Ocm/Metadata] Error al obtener metadata de OCM: ${err.message}`);
        return NextResponse.json({ 
            error: 'Error al obtener condiciones y clasificaciones', 
            details: err.message 
        }, { status: 500 });
    }
}
