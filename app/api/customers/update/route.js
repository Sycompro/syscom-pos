import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const body = await request.json();
        const { id, nomcli, celcli, email, direccion, fecnac } = body;

        if (!id) return NextResponse.json({ error: 'ID de cliente es requerido' }, { status: 400 });

        const pool = await getConnection(session.user.company);
        
        // Actualizar datos en mst01cli
        await pool.request()
            .input('codcli', sql.Char(6), id)
            .input('nomcli', sql.Char(60), (nomcli || '').substring(0, 60).toUpperCase())
            .input('celcli', sql.VarChar(40), (celcli || '').substring(0, 40))
            .input('email', sql.VarChar(60), (email || '').substring(0, 60))
            .input('dircli', sql.Char(80), (direccion || '').substring(0, 80).toUpperCase())
            .input('fecnac', sql.DateTime, fecnac ? new Date(fecnac) : null)
            .query(`
                UPDATE mst01cli 
                SET nomcli = @nomcli,
                    celcli = @celcli,
                    email = @email,
                    dircli = @dircli,
                    fecnac = @fecnac
                WHERE codcli = @codcli
            `);

        return NextResponse.json({ success: true, message: 'Cliente actualizado correctamente' });

    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
