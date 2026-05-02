import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    const { idApeCaj } = await request.json();

    if (!idApeCaj) return NextResponse.json({ error: 'Falta idApeCaj' }, { status: 400 });

    try {
        const pool = await getConnection(session?.user?.company);
        await pool.request()
            .input('idApeCaj', sql.Int, idApeCaj)
            .input('feccie', sql.DateTime, new Date())
            .query(`
                UPDATE dtl_restpos_apecaj 
                SET estado = 1, feccie = @feccie 
                WHERE idapecaj = @idApeCaj
            `);

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
