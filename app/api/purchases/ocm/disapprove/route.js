import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getConnection } from "@/lib/db";
import sql from 'mssql';
import logger from "@/lib/logger";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Restringir a ADMINISTRADOR o SUPERVISOR
        const userRole = session.user.role?.toUpperCase() || '';
        const userId = session.user.id?.trim() || '';
        const isAuthorized = userRole === 'ADMINISTRADOR' || userRole === 'SUPERVISOR' || userId === '001';

        if (!isAuthorized) {
            return NextResponse.json({ error: 'No tienes permisos para desaprobar esta orden de compra' }, { status: 403 });
        }

        const body = await req.json();
        const { ndocu } = body;

        if (!ndocu) {
            return NextResponse.json({ error: 'El parámetro ndocu es requerido' }, { status: 400 });
        }

        const pool = await getConnection(session.user.company);

        // 1. Validar que la OCM exista y no tenga Nota de Ingreso
        const checkOcm = await pool.request()
            .input('ndocu', sql.Char(12), ndocu.substring(0, 12))
            .query(`
                SELECT flag, LTRIM(RTRIM(nota)) as nota
                FROM mst01ocm WITH(nolock)
                WHERE cdocu = '28' AND ndocu = @ndocu
            `);

        if (checkOcm.recordset.length === 0) {
            return NextResponse.json({ error: 'La Orden de Compra no existe en el ERP' }, { status: 404 });
        }

        const ocm = checkOcm.recordset[0];
        
        // Consultar si tiene cantidades ya recibidas en el detalle
        const dtlRes = await pool.request()
            .input('ndocu', sql.Char(12), ndocu.substring(0, 12))
            .query(`
                SELECT SUM(recib) as totalRecibido
                FROM dtl01ocm WITH(nolock)
                WHERE cdocu = '28' AND ndocu = @ndocu
            `);

        const totalRecibido = dtlRes.recordset[0]?.totalRecibido || 0;

        if (ocm.flag === '1' || ocm.flag === '2' || (ocm.nota && ocm.nota.trim() !== '') || totalRecibido > 0) {
            return NextResponse.json({ 
                error: 'No se puede desaprobar: La Orden de Compra ya tiene Notas de Ingreso asociadas en el ERP' 
            }, { status: 400 });
        }

        // 2. Ejecutar la desaprobación (apro = 0)
        logger.info(`[API/Purchases/Ocm/Disapprove] Desaprobando OCM ${ndocu} por el usuario ${userId}`);
        await pool.request()
            .input('ndocu', sql.Char(12), ndocu.substring(0, 12))
            .query(`
                UPDATE mst01ocm 
                SET apro = 0, 
                    aprofec = NULL, 
                    aprousu = '' 
                WHERE cdocu = '28' AND ndocu = @ndocu
            `);

        return NextResponse.json({ 
            success: true, 
            message: 'La Orden de Compra ha sido desaprobada con éxito y ahora es editable.' 
        });

    } catch (err) {
        logger.error(`[API/Purchases/Ocm/Disapprove] Error al desaprobar OCM: ${err.message}`);
        return NextResponse.json({ 
            error: 'Error interno al desaprobar la Orden de Compra', 
            details: err.message 
        }, { status: 500 });
    }
}
