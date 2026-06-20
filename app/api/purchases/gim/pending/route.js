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
        const ndocu = searchParams.get('ndocu') || '';

        const pool = await getConnection(session.user.company);

        if (ndocu) {
            // Obtener cabecera y detalles de una GIM específica para importar
            const resHeader = await pool.request()
                .input('ndocu', ndocu)
                .query(`
                    SELECT TOP 1
                        fecha, LTRIM(RTRIM(ndocu)) as ndocu, LTRIM(RTRIM(codpro)) as codpro, 
                        LTRIM(RTRIM(nompro)) as nompro, LTRIM(RTRIM(rucpro)) as rucpro, 
                        tota, toti, totn, LTRIM(RTRIM(codalm)) as codalm
                    FROM mst01gim WITH(nolock)
                    WHERE ndocu = @ndocu AND cdocu = '29'
                `);

            if (resHeader.recordset.length === 0) {
                return NextResponse.json({ error: 'Nota de ingreso no encontrada' }, { status: 404 });
            }

            const resItems = await pool.request()
                .input('ndocu', ndocu)
                .query(`
                    SELECT 
                        item, LTRIM(RTRIM(codi)) as id, LTRIM(RTRIM(codf)) as userCode, 
                        LTRIM(RTRIM(marc)) as brand, LTRIM(RTRIM(descr)) as name, 
                        LTRIM(RTRIM(umed)) as unit, cant, aigv,
                        preu as netUnitPrice,
                        CASE WHEN aigv = 'S' THEN ROUND(preu * 1.18, 4) ELSE preu END as cost
                    FROM dtl01gim WITH(nolock)
                    WHERE ndocu = @ndocu AND cdocu = '29'
                    ORDER BY item ASC
                `);

            return NextResponse.json({
                success: true,
                note: resHeader.recordset[0],
                items: resItems.recordset
            });
        } else {
            // Listar todas las notas de ingreso que no estén facturadas en mst01ccp
            const resList = await pool.request().query(`
                SELECT 
                    g.fecha, LTRIM(RTRIM(g.ndocu)) as ndocu, LTRIM(RTRIM(g.codpro)) as codpro, 
                    LTRIM(RTRIM(g.nompro)) as nompro, LTRIM(RTRIM(g.rucpro)) as rucpro, 
                    g.totn
                FROM mst01gim g WITH(nolock)
                WHERE g.cdocu = '29' AND g.flag = '0'
                  AND NOT EXISTS (
                      SELECT 1 FROM mst01ccp c WITH(nolock) 
                      WHERE g.ndocu = c.nrefe AND c.crefe = '29' AND c.codpro = g.codpro
                  )
                ORDER BY g.fecha DESC, g.ndocu DESC
            `);

            return NextResponse.json({
                success: true,
                notes: resList.recordset
            });
        }

    } catch (err) {
        logger.error(`[API/Purchases/Gim/Pending] Error: ${err.message}`);
        return NextResponse.json({ error: 'Error al consultar GIM pendientes', details: err.message }, { status: 500 });
    }
}
