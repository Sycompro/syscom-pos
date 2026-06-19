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

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q') || '';

        const pool = await getConnection(session.user.company);
        
        let query = `
            SELECT TOP 100 
                fecha, cdocu, LTRIM(RTRIM(ndocu)) as ndocu, LTRIM(RTRIM(codpro)) as codpro, 
                LTRIM(RTRIM(nompro)) as nompro, LTRIM(RTRIM(rucpro)) as rucpro, 
                totb, tota, toti, totn, fven, flag, LTRIM(RTRIM(codalm)) as codalm
            FROM mst01ocm WITH(nolock)
        `;

        const request = pool.request();
        if (q) {
            request.input('q', `%${q}%`);
            query += ` WHERE nompro LIKE @q OR rucpro LIKE @q OR ndocu LIKE @q `;
        }
        query += ` ORDER BY fecha DESC, ndocu DESC `;

        const result = await request.query(query);

        return NextResponse.json({
            success: true,
            orders: result.recordset
        });

    } catch (err) {
        logger.error(`[API/Purchases/Ocm/List] Error al listar OCM: ${err.message}`);
        return NextResponse.json({ error: 'Error al listar Órdenes de Compra', details: err.message }, { status: 500 });
    }
}
