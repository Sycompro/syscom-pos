import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import logger from "@/lib/logger";
import NavaPurchaseService from "@/services/nava-purchase-service";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        logger.info(`[API/Purchases/Ocm/Create] Recibida solicitud de OCM para ${session.user.company}`, { body });

        const { idApeCaj, supplier, items } = body;
        if (!idApeCaj) {
            return NextResponse.json({ error: 'ID de apertura de caja (idApeCaj) es requerido' }, { status: 400 });
        }
        if (!supplier || !supplier.codpro) {
            return NextResponse.json({ error: 'Datos del proveedor (supplier.codpro) requeridos' }, { status: 400 });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'La lista de ítems debe contener al menos un producto' }, { status: 400 });
        }

        const result = await NavaPurchaseService.createOCM(body, session.user.company, session.user.id || 'ADMIN');

        return NextResponse.json(result);

    } catch (err) {
        logger.error(`[API/Purchases/Ocm/Create] Error crítico al registrar OCM: ${err.message}`, { stack: err.stack });
        return NextResponse.json({ 
            error: 'Error interno al registrar la Orden de Compra',
            details: err.message 
        }, { status: 500 });
    }
}
