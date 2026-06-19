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

        // Query simple de los proveedores para el panel de administración
        if (query) {
            requestSql.input('q', sql.VarChar(50), `%${query}%`);
            sqlQuery = `
                SELECT TOP 100 
                    RTRIM(codpro) as codpro, 
                    RTRIM(nompro) as nompro, 
                    RTRIM(rucpro) as rucpro, 
                    RTRIM(dirpro) as dirpro,
                    RTRIM(telpro) as telpro,
                    RTRIM(email) as email,
                    estado
                FROM mst01pro WITH(nolock)
                WHERE (nompro LIKE @q OR rucpro LIKE @q OR codpro LIKE @q)
                  AND codpro <> 'P00000' -- Excluir el comodín VARIOS del catálogo administrativo
                ORDER BY nompro ASC
            `;
        } else {
            sqlQuery = `
                SELECT TOP 100 
                    RTRIM(codpro) as codpro, 
                    RTRIM(nompro) as nompro, 
                    RTRIM(rucpro) as rucpro, 
                    RTRIM(dirpro) as dirpro,
                    RTRIM(telpro) as telpro,
                    RTRIM(email) as email,
                    estado
                FROM mst01pro WITH(nolock)
                WHERE codpro <> 'P00000'
                ORDER BY nompro ASC
            `;
        }

        const result = await requestSql.query(sqlQuery);
        
        const suppliers = result.recordset.map(r => ({
            codpro: r.codpro,
            nompro: r.nompro,
            rucpro: r.rucpro || '',
            dirpro: r.dirpro || '',
            telpro: r.telpro || '',
            email: r.email || '',
            estado: r.estado
        }));

        return NextResponse.json({ success: true, suppliers });

    } catch (error) {
        console.error('[API Suppliers List] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
