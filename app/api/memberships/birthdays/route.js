import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getConnection } from '@/lib/db';
import sql from 'mssql';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const month = searchParams.get('month') || (new Date().getMonth() + 1).toString();

        const pool = await getConnection(session.user.company);
        
        // Consultar socios con cumpleaños en el mes seleccionado
        // Unimos con mst01cli para obtener la fecha de nacimiento (fecnac)
        const result = await pool.request()
            .input('month', sql.Int, parseInt(month))
            .query(`
                SELECT 
                    C.codcli, 
                    C.nomcli, 
                    C.celcli as phone, 
                    C.email,
                    RTRIM(C.dircli) as address,
                    C.fecnac,
                    DAY(C.fecnac) as birthDay,
                    MONTH(C.fecnac) as birthMonth,
                    DATEDIFF(YEAR, C.fecnac, GETDATE()) as age
                FROM mst01cli C
                WHERE MONTH(C.fecnac) = @month
                ORDER BY DAY(C.fecnac) ASC
            `);

        return NextResponse.json({ 
            success: true, 
            birthdays: result.recordset,
            currentMonth: parseInt(month)
        });

    } catch (err) {
        console.error('Error fetching birthdays:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
