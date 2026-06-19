import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = (searchParams.get('q') || '').trim();
        const company = session.user.company;
        const pool = await getConnection(company);

        let sqlQuery = "";
        const requestSql = pool.request();

        if (query) {
            requestSql.input('q', sql.VarChar(50), `%${query}%`);
            sqlQuery = `
                SELECT TOP 30 
                    RTRIM(codpro) as codpro, 
                    RTRIM(nompro) as nompro, 
                    RTRIM(rucpro) as rucpro, 
                    RTRIM(dirpro) as dirpro
                FROM mst01pro WITH(nolock)
                WHERE estado = 1 
                  AND (nompro LIKE @q OR rucpro LIKE @q OR codpro LIKE @q)
                ORDER BY nompro ASC
            `;
        } else {
            sqlQuery = `
                SELECT TOP 20 
                    RTRIM(codpro) as codpro, 
                    RTRIM(nompro) as nompro, 
                    RTRIM(rucpro) as rucpro, 
                    RTRIM(dirpro) as dirpro
                FROM mst01pro WITH(nolock)
                WHERE estado = 1
                ORDER BY nompro ASC
            `;
        }

        const result = await requestSql.query(sqlQuery);
        
        const suppliers = result.recordset.map(r => ({
            codpro: r.codpro,
            nompro: r.nompro,
            rucpro: r.rucpro || '',
            dirpro: r.dirpro || ''
        }));

        return NextResponse.json(suppliers);

    } catch (error) {
        console.error('[API Suppliers Search] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
