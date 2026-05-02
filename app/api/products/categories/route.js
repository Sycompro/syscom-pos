import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const pool = await getConnection(session.user.company);
        const result = await pool.request().query(`
            SELECT DISTINCT 
                LTRIM(RTRIM(codsub)) as id, 
                LTRIM(RTRIM(nomsub)) as name 
            FROM tbl01sbf 
            WHERE restpos = 'S' OR restpos = '1'
            ORDER BY nomsub ASC
        `);

        return NextResponse.json(result.recordset);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
