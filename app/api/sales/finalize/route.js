import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import logger from "@/lib/logger";
import { saleSchema } from "@/lib/validations/sale";
import NavaSaleService from "@/services/nava-sale-service";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        logger.info(`[API/Finalize] Recibida solicitud de venta para ${session.user.company}`, { body });

        // 1. Validar datos con Zod
        const validation = saleSchema.safeParse(body);
        if (!validation.success) {
            const errors = validation.error.format();
            logger.warn(`[API/Finalize] Validación fallida:`, errors);
            return NextResponse.json({ 
                error: 'Datos de venta inválidos', 
                details: errors 
            }, { status: 400 });
        }

        // 2. Ejecutar servicio de venta
        const result = await NavaSaleService.finalize(validation.data, session.user.company, session.user.id);

        return NextResponse.json(result);

    } catch (err) {
        logger.error(`[API/Finalize] Error crítico: ${err.message}`, { stack: err.stack });
        return NextResponse.json({ 
            error: 'Error interno al procesar la venta',
            details: err.message 
        }, { status: 500 });
    }
}
