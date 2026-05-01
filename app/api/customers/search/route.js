import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) return NextResponse.json({ data: null });

    try {
        const pool = await getConnection();
        
        // Buscar en local primero
        const result = await pool.request()
            .input('query', sql.VarChar(20), query)
            .query("SELECT TOP 1 codcli, nomcli, ruccli, nrodni, dircli FROM mst01cli WHERE ruccli = @query OR nrodni = @query");

        if (result.recordset.length > 0) {
            const cli = result.recordset[0];
            return NextResponse.json({ 
                data: {
                    codcli: cli.codcli.trim(),
                    nomcli: cli.nomcli.trim(),
                    ruccli: cli.ruccli.trim() || cli.nrodni.trim(),
                    address: cli.dircli.trim()
                }
            });
        }

        // Si no está, buscar en API externa (DNI/RUC)
        const apiRes = await fetch('https://apiperu.dev/api/dni-ruc', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 76ca7246c8a8c464fd551b6555e780791a69ff89acb8887558d65b23f05ab81b'
            },
            body: JSON.stringify({ dni: query, ruc: query })
        });

        const apiData = await apiRes.json();

        if (apiData.success && apiData.data) {
            const data = apiData.data;
            return NextResponse.json({
                data: {
                    codcli: 'NUEVO',
                    nomcli: data.nombre_completo || data.nombre_o_razon_social,
                    ruccli: data.ruc || data.dni,
                    address: data.direccion_completa || '',
                    isNew: true
                }
            });
        }

        return NextResponse.json({ data: null });

    } catch (err) {
        console.error('Search customer error:', err);
        return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 });
    }
}
