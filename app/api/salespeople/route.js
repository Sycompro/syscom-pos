import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const pool = await getConnection(session?.user?.company);
        
        const result = await pool.request().query(`
            SELECT codven as id, nomven as name 
            FROM tbl01ven 
            WHERE estado = '0' 
            ORDER BY nomven ASC
        `);

        return NextResponse.json(result.recordset);
    } catch (err) {
        console.error('[API/Salespeople] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
