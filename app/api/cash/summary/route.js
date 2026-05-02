import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const idApeCaj = searchParams.get('idApeCaj');

    if (!idApeCaj) return NextResponse.json({ error: 'Falta idApeCaj' }, { status: 400 });

    try {
        const pool = await getConnection(session?.user?.company);
        const result = await pool.request()
            .input('idApeCaj', sql.Int, idApeCaj)
            .query(`
                SELECT 
                    SUM(CASE WHEN selpago = 1 THEN tota ELSE 0 END) as cash,
                    SUM(CASE WHEN selpago <> 1 THEN tota ELSE 0 END) as card,
                    SUM(tota) as total,
                    COUNT(*) as count
                FROM mst01fac 
                WHERE idapecaj = @idApeCaj
            `);

        const summary = result.recordset[0];
        return NextResponse.json({
            cash: summary.cash || 0,
            card: summary.card || 0,
            total: summary.total || 0,
            count: summary.count || 0
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
