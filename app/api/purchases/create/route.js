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
        logger.info(`[API/Purchases/Create] Recibida solicitud de compra para ${session.user.company}`, { body });

        // Validación básica de los datos recibidos
        const { idApeCaj, supplier, docType, docNumber, items } = body;
        if (!idApeCaj) {
            return NextResponse.json({ error: 'ID de apertura de caja (idApeCaj) es requerido' }, { status: 400 });
        }
        if (!supplier || !supplier.codpro) {
            return NextResponse.json({ error: 'Datos del proveedor (supplier.codpro) requeridos' }, { status: 400 });
        }
        if (!docType || !docNumber) {
            return NextResponse.json({ error: 'Tipo y número de comprobante son requeridos' }, { status: 400 });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'La lista de ítems debe contener al menos un producto' }, { status: 400 });
        }

        // Ejecutar el registro de compra
        const result = await NavaPurchaseService.create(body, session.user.company, session.user.id || 'ADMIN');

        return NextResponse.json(result);

    } catch (err) {
        logger.error(`[API/Purchases/Create] Error crítico al registrar compra: ${err.message}`, { stack: err.stack });
        return NextResponse.json({ 
            error: 'Error interno al registrar la compra',
            details: err.message 
        }, { status: 500 });
    }
}
