import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const docType = searchParams.get('docType') || '';

    const isCE = docType === 'CE' || (query.length !== 8 && query.length !== 11);
    const minLength = isCE ? 5 : 8;
    if (!query || query.length < minLength) return NextResponse.json({ data: null });

    try {
        const pool = await getConnection(session?.user?.company);
        
        // 1. BUSCAR EN NAVASOFT (ERP) - Siempre es prioridad
        const erpRes = await pool.request()
                .input('q', sql.VarChar(20), query)
                .query("SELECT TOP 1 codcli, nomcli, ruccli, nrodni, dircli, celcli, telcli, fecnac, fecfinpres, ISNULL(mcredi, 0) as mcredi FROM mst01cli WHERE LTRIM(RTRIM(ruccli)) = @q OR LTRIM(RTRIM(nrodni)) = @q");

        const erp = erpRes.recordset[0];
        let internal = null;

        // 2. BUSCAR EN RAILWAY (Opcional, con try-catch para no romper)
        try {
            const railwayRes = await pool.request()
                .input('q', sql.VarChar(20), query)
                .query("SELECT TOP 1 phone, birthdate, name, lastname FROM tbl_clientes_internos WHERE doc = @q");
            internal = railwayRes.recordset[0];
        } catch (e) {
            console.log('Tabla interna no disponible, continuando...');
        }

        let finalData = null;

        // CASO A: El cliente ya existe en el ERP (Prioridad 1)
        if (erp) {
            finalData = {
                codcli: erp.codcli.trim(),
                nomcli: erp.nomcli.trim(),
                ruccli: (erp.ruccli || erp.nrodni || '').trim(),
                address: (erp.dircli || '').trim(),
                phone: (erp.celcli || erp.telcli || internal?.phone || '').trim(),
                birthdate: erp.fecnac ? new Date(erp.fecnac).toISOString().split('T')[0] : (internal?.birthdate || ''),
                expirationDate: erp.fecfinpres && erp.fecfinpres.getFullYear() > 1900 ? erp.fecfinpres.toISOString() : null,
                mcredi: Number(erp.mcredi) || 0,
                source: internal ? 'ERP + RAILWAY' : 'ERP'
            };
        }

        // CASO B: No está en ERP -> Consultar RENIEC/SUNAT (Caso "Ya creció" o "Nuevo")
        if (!finalData) {
            const isCE = docType === 'CE' || (query.length !== 8 && query.length !== 11);
            if (isCE) {
                finalData = {
                    codcli: 'NUEVO_ERP',
                    nomcli: '',
                    ruccli: query,
                    address: '',
                    phone: internal?.phone || '',
                    birthdate: internal?.birthdate || '',
                    isNew: true,
                    source: 'MANUAL_CE'
                };
            } else {
                const isRuc = query.length === 11;
                const endpoint = isRuc ? 'https://apiperu.dev/api/ruc' : 'https://apiperu.dev/api/dni';
                
                try {
                    const apiRes = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer 76ca7246c8a8c464fd551b6555e780791a69ff89acb8887558d65b23f05ab81b'
                        },
                        body: JSON.stringify(isRuc ? { ruc: query } : { dni: query })
                    });

                    const apiData = await apiRes.json();
                    if (apiData.success && apiData.data) {
                        const d = apiData.data;
                        finalData = {
                            codcli: 'NUEVO_ERP',
                            nomcli: d.nombre_completo || d.nombre_o_razon_social,
                            ruccli: d.ruc || d.dni || d.numero,
                            address: d.direccion_completa || d.direccion || '',
                            phone: internal?.phone || '',
                            birthdate: internal?.birthdate || '',
                            isNew: true,
                            source: 'EXTERNAL'
                        };
                    }
                } catch (e) {
                    console.error('External API failed');
                }
            }
        }

        // CASO C: No está en ERP ni en RENIEC (Sigue siendo menor o extranjero)
        if (!finalData && internal) {
            finalData = {
                codcli: 'INTERNAL',
                nomcli: `${internal.name} ${internal.lastname}`.trim(),
                ruccli: query,
                phone: internal.phone || '',
                birthdate: internal.birthdate || '',
                source: 'RAILWAY_ONLY'
            };
        }

        if (finalData) {
            return NextResponse.json({ data: finalData });
        }

        return NextResponse.json({ 
            data: null, 
            message: 'No se encontraron registros en ninguna base de datos.' 
        });

    } catch (err) {
        console.error('Search customer error:', err);
        return NextResponse.json({ error: 'Error crítico en el buscador' }, { status: 500 });
    }
}
