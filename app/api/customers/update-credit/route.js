import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { codcli, limit } = body;

        if (!codcli || limit === undefined) {
            return NextResponse.json({ error: 'Faltan parámetros obligatorios (codcli, limit)' }, { status: 400 });
        }

        const numericLimit = Number(limit);
        if (isNaN(numericLimit) || numericLimit < 0) {
            return NextResponse.json({ error: 'El límite debe ser un número mayor o igual a 0' }, { status: 400 });
        }

        const pool = await getConnection(session.user.company);

        // Actualizar mcredi
        const result = await pool.request()
            .input('codcli', sql.Char(6), codcli)
            .input('limit', sql.Decimal(18, 2), numericLimit)
            .query(`UPDATE mst01cli SET mcredi = @limit WHERE codcli = @codcli`);

        if (result.rowsAffected[0] === 0) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'Límite de crédito actualizado correctamente',
            data: { codcli, limit: numericLimit }
        });

    } catch (err) {
        console.error('[API/Customers/UpdateCredit] Error:', err);
        return NextResponse.json({ 
            success: false, 
            error: 'Error al actualizar el límite de crédito',
            details: err.message 
        }, { status: 500 });
    }
}
