import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getConnection } from "@/lib/db";
import sql from 'mssql';
import logger from "@/lib/logger";

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const ndocu = searchParams.get('ndocu');

        if (!ndocu) {
            return NextResponse.json({ error: 'El parámetro ndocu es requerido' }, { status: 400 });
        }

        const pool = await getConnection(session.user.company);

        // 1. Consultar estado en la cabecera (mst01ocm)
        const ocmRes = await pool.request()
            .input('ndocu', sql.Char(12), ndocu.substring(0, 12))
            .query(`
                SELECT flag, apro, LTRIM(RTRIM(nota)) as nota
                FROM mst01ocm WITH(nolock)
                WHERE cdocu = '28' AND ndocu = @ndocu
            `);

        if (ocmRes.recordset.length === 0) {
            return NextResponse.json({ error: 'La Orden de Compra no existe en el ERP' }, { status: 404 });
        }

        const ocm = ocmRes.recordset[0];

        // 2. Consultar si tiene cantidades ya recibidas en el detalle (dtl01ocm)
        const dtlRes = await pool.request()
            .input('ndocu', sql.Char(12), ndocu.substring(0, 12))
            .query(`
                SELECT SUM(recib) as totalRecibido
                FROM dtl01ocm WITH(nolock)
                WHERE cdocu = '28' AND ndocu = @ndocu
            `);

        const totalRecibido = dtlRes.recordset[0]?.totalRecibido || 0;

        // Regla 1: Bloqueo total por Notas de Ingreso (GIM) vinculadas
        if (ocm.flag === '1' || ocm.flag === '2' || (ocm.nota && ocm.nota.trim() !== '') || totalRecibido > 0) {
            return NextResponse.json({
                success: true,
                editable: false,
                reason: 'has_gim',
                details: 'La Orden de Compra ya tiene Notas de Ingreso asociadas en el ERP. No se puede modificar.'
            });
        }

        // Regla 2: Bloqueo por aprobación
        // El ERP puede guardar la aprobación como un valor numérico (1) o carácter.
        const isApproved = ocm.apro == 1 || ocm.apro === '1';
        if (isApproved) {
            return NextResponse.json({
                success: true,
                editable: false,
                reason: 'approved',
                details: 'La Orden de Compra está aprobada. Un supervisor debe desaprobarla para permitir cambios.'
            });
        }

        // Si supera las validaciones, es editable
        return NextResponse.json({
            success: true,
            editable: true
        });

    } catch (err) {
        logger.error(`[API/Purchases/Ocm/Validate] Error al validar estado de OCM: ${err.message}`);
        return NextResponse.json({ 
            error: 'Error interno al validar el estado del documento', 
            details: err.message 
        }, { status: 500 });
    }
}
