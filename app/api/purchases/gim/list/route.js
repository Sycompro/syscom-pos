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
                tota, toti, totn, LTRIM(RTRIM(codalm)) as codalm,
                LTRIM(RTRIM(crefe)) as crefe, LTRIM(RTRIM(nrefe)) as nrefe
            FROM mst01gim WITH(nolock)
            WHERE cdocu = '29'
        `;

        const request = pool.request();
        if (q) {
            request.input('q', `%${q}%`);
            query += ` AND (nompro LIKE @q OR rucpro LIKE @q OR ndocu LIKE @q OR nrefe LIKE @q) `;
        }
        query += ` ORDER BY fecha DESC, ndocu DESC `;

        const result = await request.query(query);

        return NextResponse.json({
            success: true,
            notes: result.recordset
        });

    } catch (err) {
        logger.error(`[API/Purchases/Gim/List] Error: ${err.message}`);
        return NextResponse.json({ error: 'Error al listar Notas de Ingreso', details: err.message }, { status: 500 });
    }
}
