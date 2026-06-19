import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.company) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { codpro, nompro, rucpro, dirpro, telpro, email } = body;

        if (!codpro) {
            return NextResponse.json({ error: 'El código del proveedor (codpro) es requerido' }, { status: 400 });
        }
        if (!nompro) {
            return NextResponse.json({ error: 'Razón Social / Nombre es requerido' }, { status: 400 });
        }
        if (!rucpro) {
            return NextResponse.json({ error: 'RUC / Documento es requerido' }, { status: 400 });
        }

        const pool = await getConnection(session.user.company);
        
        const reqUpdate = pool.request();
        reqUpdate.input('codpro', sql.Char(6), codpro);
        reqUpdate.input('nompro', sql.Char(60), nompro.trim().toUpperCase().substring(0, 60));
        reqUpdate.input('rucpro', sql.Char(11), rucpro.trim().substring(0, 11));
        reqUpdate.input('dirpro', sql.VarChar(60), (dirpro || '').trim().toUpperCase().substring(0, 60));
        reqUpdate.input('telpro', sql.VarChar(25), (telpro || '').trim().substring(0, 25));
        reqUpdate.input('email', sql.VarChar(60), (email || '').trim().substring(0, 60));

        const result = await reqUpdate.query(`
            UPDATE mst01pro
            SET nompro = @nompro,
                rucpro = @rucpro,
                dirpro = @dirpro,
                telpro = @telpro,
                email = @email
            WHERE codpro = @codpro
        `);

        if (result.rowsAffected[0] === 0) {
            return NextResponse.json({ success: false, error: 'Proveedor no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[API Suppliers Update] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
export async function POST(request) {
    // Para soportar frameworks que usen POST como fallback para PATCH
    return PATCH(request);
}
