import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const pool = await getConnection(session.user.company);
        
        let methods = [{ id: 'EF', name: 'EFECTIVO', type: 1 }];

        // 1. Intentar con Esquema ERP (tbl01tar)
        try {
            const result = await pool.request()
                .query("SELECT codtar as id, nomtar as name FROM tbl01tar"); // Quitamos flag=1 para ver todos
            
            if (result.recordset.length > 0) {
                console.log(`[API/PaymentMethods] Se encontraron ${result.recordset.length} métodos en tbl01tar`);
                methods = [
                    ...methods,
                    ...result.recordset.map(r => {
                        const name = (r.name || '').toString().trim().toUpperCase();
                        let type = 3; // Smartphone por defecto (Yape/Plin)
                        if (name.includes('TARJETA') || name.includes('VISA') || name.includes('MASTER')) type = 2;
                        if (name.includes('EFECTIVO')) type = 1;

                        return { 
                            id: (r.id || '').toString().trim(), 
                            name: (r.name || '').toString().trim(), 
                            type: type 
                        };
                    })
                ];
                return NextResponse.json(methods);
            }
        } catch (e) {
            console.log("[API/PaymentMethods] Esquema ERP no detectado.");
        }

        // 2. Intentar con Esquema POS (MetodoPago)
        try {
            const result = await pool.request()
                .query("SELECT MetodoPagoId as id, Descripcion as name FROM MetodoPago WHERE Estado = 1");
            
            if (result.recordset.length > 0) {
                methods = result.recordset.map(r => ({ 
                    id: (r.id || '').toString().trim(), 
                    name: (r.name || '').toString().trim(), 
                    type: r.name.toUpperCase().includes('EFECTIVO') ? 1 : 3 
                }));
                return NextResponse.json(methods);
            }
        } catch (e) {
            console.error("[API/PaymentMethods] Ningún esquema de métodos de pago encontrado.");
        }

        return NextResponse.json(methods);

    } catch (err) {
        console.error('[API/PaymentMethods] CRITICAL ERROR:', err.message);
        return NextResponse.json({ 
            error: 'Error al obtener métodos de pago',
            details: err.message
        }, { status: 500 });
    }
}
