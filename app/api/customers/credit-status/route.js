import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const codcli = (searchParams.get('codcli') || '').trim();

        if (!codcli) {
            return NextResponse.json({ error: 'Falta el parámetro codcli' }, { status: 400 });
        }

        const pool = await getConnection(session.user.company);

        // 1. Obtener límite de crédito y nombre del cliente
        const clientRes = await pool.request()
            .input('codcli', sql.Char(6), codcli)
            .query(`SELECT nomcli, ISNULL(mcredi, 0) as mcredi FROM mst01cli WHERE codcli = @codcli`);

        if (clientRes.recordset.length === 0) {
            return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
        }

        const { nomcli, mcredi } = clientRes.recordset[0];
        const limit = Number(mcredi) || 0;

        // 2. Obtener facturas pendientes de cobro
        const invoiceRes = await pool.request()
            .input('codcli', sql.Char(6), codcli)
            .query(`
                SELECT fecha, fven, cdocu, ndocu, monto, saldo 
                FROM mst01ccc 
                WHERE codcli = @codcli AND saldo > 0 AND flag <> '*'
                ORDER BY fecha ASC
            `);

        const pendingInvoices = invoiceRes.recordset.map(inv => ({
            fecha: inv.fecha ? new Date(inv.fecha).toISOString().split('T')[0] : '',
            fven: inv.fven ? new Date(inv.fven).toISOString().split('T')[0] : '',
            cdocu: (inv.cdocu || '').trim(),
            ndocu: (inv.ndocu || '').trim(),
            monto: Number(inv.monto) || 0,
            saldo: Number(inv.saldo) || 0
        }));

        const debt = pendingInvoices.reduce((sum, inv) => sum + inv.saldo, 0);
        // Deuda total redondeada a 2 decimales para evitar problemas de coma flotante
        const debtRounded = Number(debt.toFixed(2));
        const available = Number(Math.max(0, limit - debtRounded).toFixed(2));

        return NextResponse.json({
            success: true,
            data: {
                codcli: codcli,
                nomcli: nomcli.trim(),
                limit,
                debt: debtRounded,
                available,
                pendingInvoices
            }
        });

    } catch (err) {
        console.error('[API/Customers/CreditStatus] Error:', err);
        return NextResponse.json({ 
            success: false, 
            error: 'Error al obtener el estado de crédito del cliente',
            details: err.message 
        }, { status: 500 });
    }
}
