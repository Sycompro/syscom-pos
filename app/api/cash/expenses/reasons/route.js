import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const pool = await getConnection(session.user.company);
        const result = await pool.request().query(`
            SELECT 
                LTRIM(RTRIM(codmotivo)) as id, 
                LTRIM(RTRIM(motivo)) as name 
            FROM tblrestpos_motegrcaja
            ORDER BY codmotivo ASC
        `);

        return NextResponse.json(result.recordset);
    } catch (error) {
        console.error('Error fetching expense reasons:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
