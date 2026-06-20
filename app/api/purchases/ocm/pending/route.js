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
            // Obtener cabecera y detalles de una OCM específica para importar
            const resHeader = await pool.request()
                .input('ndocu', ndocu)
                .query(`
                    SELECT TOP 1
                        fecha, LTRIM(RTRIM(ndocu)) as ndocu, LTRIM(RTRIM(codpro)) as codpro, 
                        LTRIM(RTRIM(nompro)) as nompro, LTRIM(RTRIM(rucpro)) as rucpro, 
                        totb, tota, toti, totn, LTRIM(RTRIM(codalm)) as codalm
                    FROM mst01ocm WITH(nolock)
                    WHERE ndocu = @ndocu AND flag = '1'
                `);

            if (resHeader.recordset.length === 0) {
                return NextResponse.json({ error: 'Orden de compra no encontrada o inactiva' }, { status: 404 });
            }

            const resItems = await pool.request()
                .input('ndocu', ndocu)
                .query(`
                    SELECT 
                        item, LTRIM(RTRIM(codi)) as id, LTRIM(RTRIM(codf)) as userCode, 
                        LTRIM(RTRIM(marc)) as brand, LTRIM(RTRIM(descr)) as name, 
                        LTRIM(RTRIM(umed)) as unit, cant, recib, aigv,
                        (cant - recib) as pendingQty,
                        preu as netUnitPrice,
                        -- Reconstruir precio costo con IGV aproximado para el formulario POS
                        CASE WHEN aigv = 'S' THEN ROUND(preu * 1.18, 4) ELSE preu END as cost
                    FROM dtl01ocm WITH(nolock)
                    WHERE ndocu = @ndocu AND cant > recib
                    ORDER BY item ASC
                `);

            return NextResponse.json({
                success: true,
                order: resHeader.recordset[0],
                items: resItems.recordset
            });
        } else {
            // Listar todas las órdenes de compra con saldo pendiente
            const resList = await pool.request().query(`
                SELECT 
                    o.fecha, LTRIM(RTRIM(o.ndocu)) as ndocu, LTRIM(RTRIM(o.codpro)) as codpro, 
                    LTRIM(RTRIM(o.nompro)) as nompro, LTRIM(RTRIM(o.rucpro)) as rucpro, 
                    o.totn
                FROM mst01ocm o WITH(nolock)
                WHERE o.flag = '1'
                  AND EXISTS (
                      SELECT 1 FROM dtl01ocm d WITH(nolock) 
                      WHERE o.ndocu = d.ndocu AND o.cdocu = d.cdocu AND d.cant > d.recib
                  )
                ORDER BY o.fecha DESC, o.ndocu DESC
            `);

            return NextResponse.json({
                success: true,
                orders: resList.recordset
            });
        }

    } catch (err) {
        logger.error(`[API/Purchases/Ocm/Pending] Error: ${err.message}`);
        return NextResponse.json({ error: 'Error al consultar OCM pendientes', details: err.message }, { status: 500 });
    }
}
