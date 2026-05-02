import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cdocu = searchParams.get('cdocu');
    const ndocu = searchParams.get('ndocu');

    if (!cdocu || !ndocu) {
        return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    try {
        const pool = await getConnection(session.user.company);
        
        const result = await pool.request()
            .input('cdocu', sql.Char(2), cdocu)
            .input('ndocu', sql.Char(12), ndocu)
            .query(`
                SELECT 
                    RTRIM(codi) as code, 
                    RTRIM(descr) as name, 
                    cant as quantity, 
                    preu as price, 
                    tota as total
                FROM dtl01fac
                WHERE cdocu = @cdocu AND ndocu = @ndocu
            `);

        return NextResponse.json(result.recordset);

    } catch (err) {
        console.error('Sales details error:', err);
        return NextResponse.json({ error: 'Error al obtener detalles', details: err.message }, { status: 500 });
    }
}
