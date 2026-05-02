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
                SELECT ndocu, cdocu, nomcli, tota, fecha 
                FROM mst01fac 
                WHERE idapecaj = @idApeCaj 
                ORDER BY fecha DESC
            `);

        return NextResponse.json(result.recordset);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
