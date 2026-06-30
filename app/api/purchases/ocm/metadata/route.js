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
        
        // Obtener condiciones de pago de tbl01cdc (Condiciones de Compra)
        const condResult = await pool.request().query(`
            SELECT LTRIM(RTRIM(codcdc)) as codcdv, LTRIM(RTRIM(nomcdc)) as nomcdv 
            FROM tbl01cdc WITH(nolock) 
            ORDER BY codcdc
        `);

        // Obtener clasificaciones de OCM de tbl01Coc
        const cocResult = await pool.request().query(`
            SELECT LTRIM(RTRIM(codcoc)) as codcoc, LTRIM(RTRIM(Nomcoc)) as nomcoc 
            FROM tbl01Coc WITH(nolock) 
            ORDER BY codcoc
        `);

        // Obtener almacenes de tbl01alm
        const almResult = await pool.request().query(`
            SELECT LTRIM(RTRIM(codalm)) as codalm, LTRIM(RTRIM(nomalm)) as nomalm 
            FROM tbl01alm WITH(nolock) 
            ORDER BY codalm
        `);

        // Obtener transportistas de tbl01tra
        const traResult = await pool.request().query(`
            SELECT LTRIM(RTRIM(codtra)) as codtra, LTRIM(RTRIM(nomtra)) as nomtra 
            FROM tbl01tra WITH(nolock) 
            ORDER BY codtra
        `);

        return NextResponse.json({
            success: true,
            conditions: condResult.recordset,
            classifications: cocResult.recordset,
            warehouses: almResult.recordset,
            transportists: traResult.recordset
        });

    } catch (err) {
        logger.error(`[API/Purchases/Ocm/Metadata] Error al obtener metadata de OCM: ${err.message}`);
        return NextResponse.json({ 
            error: 'Error al obtener condiciones, clasificaciones, almacenes y transportistas', 
            details: err.message 
        }, { status: 500 });
    }
}
