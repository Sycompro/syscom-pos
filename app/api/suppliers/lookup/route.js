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
        const docType = searchParams.get('docType') || '06'; // default RUC '06'

        // Validaciones básicas de longitud
        const isRuc = docType === '06' || docType === 'RUC';
        const isDni = docType === '01' || docType === 'DNI';
        
        if (!query) {
            return NextResponse.json({ error: 'Documento de búsqueda es requerido' }, { status: 400 });
        }

        const pool = await getConnection(session.user.company);

        // 1. BUSCAR EN EL ERP (mst01pro)
        const checkRes = await pool.request()
            .input('q', sql.VarChar(20), query)
            .query(`
                SELECT TOP 1 
                    RTRIM(codpro) as codpro, 
                    RTRIM(nompro) as nompro, 
                    RTRIM(rucpro) as rucpro, 
                    RTRIM(dirpro) as dirpro, 
                    RTRIM(telpro) as telpro, 
                    RTRIM(email) as email,
                    RTRIM(coddocide) as coddocide
                FROM mst01pro WITH(nolock)
                WHERE LTRIM(RTRIM(rucpro)) = @q OR LTRIM(RTRIM(nrodocide)) = @q
            `);

        if (checkRes.recordset.length > 0) {
            const match = checkRes.recordset[0];
            return NextResponse.json({
                success: true,
                exists: true,
                supplier: {
                    codpro: match.codpro,
                    nompro: match.nompro,
                    rucpro: match.rucpro,
                    dirpro: match.dirpro,
                    telpro: match.telpro,
                    email: match.email,
                    coddocide: match.coddocide
                }
            });
        }

        // 2. BUSCAR EN LA API EXTERNA DE SUNAT/RENIEC (APIPERU.DEV)
        // Solo si es un DNI de 8 dígitos o RUC de 11 dígitos
        const cleanQuery = query.replace(/[^0-9]/g, '');
        if ((isRuc && cleanQuery.length === 11) || (isDni && cleanQuery.length === 8)) {
            const endpoint = isRuc ? 'https://apiperu.dev/api/ruc' : 'https://apiperu.dev/api/dni';
            
            try {
                const apiRes = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer 76ca7246c8a8c464fd551b6555e780791a69ff89acb8887558d65b23f05ab81b'
                    },
                    body: JSON.stringify(isRuc ? { ruc: cleanQuery } : { dni: cleanQuery })
                });

                const apiData = await apiRes.json();
                if (apiData.success && apiData.data) {
                    const d = apiData.data;
                    return NextResponse.json({
                        success: true,
                        exists: false,
                        data: {
                            nompro: d.nombre_completo || d.nombre_o_razon_social || '',
                            dirpro: d.direccion_completa || d.direccion || '',
                            rucpro: cleanQuery
                        }
                    });
                }
            } catch (e) {
                console.error('[API Suppliers Lookup] External API query failed:', e.message);
            }
        }

        // Caso no encontrado
        return NextResponse.json({
            success: true,
            exists: false,
            data: null,
            message: 'No se encontró información en la base de datos ni en SUNAT/RENIEC.'
        });

    } catch (error) {
        console.error('[API Suppliers Lookup] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
