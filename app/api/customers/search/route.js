import { NextResponse } from 'next/server';
import sql from 'mssql';

const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const API_PERU_TOKEN = '76ca7246c8a8c464fd551b6555e780791a69ff89acb8887558d65b23f05ab81b';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q'); // DNI or RUC

    if (!q || (q.length !== 8 && q.length !== 11)) {
        return NextResponse.json({ error: 'DNI o RUC inválido' }, { status: 400 });
    }

    try {
        const pool = await sql.connect(sqlConfig);
        
        // 1. Buscar en base de datos local
        const localRes = await pool.request()
            .input('q', sql.VarChar, q)
            .query(`
                SELECT TOP 1 codcli, nomcli, ruccli, nrodni, dircli as address
                FROM mst01cli 
                WHERE ruccli = @q OR nrodni = @q
            `);

        if (localRes.recordset.length > 0) {
            return NextResponse.json({
                source: 'local',
                data: localRes.recordset[0]
            });
        }

        // 2. Si no está local, buscar en API PERU
        const isRuc = q.length === 11;
        const apiEndpoint = isRuc 
            ? `https://apiperu.dev/api/ruc/${q}` 
            : `https://apiperu.dev/api/dni/${q}`;

        const apiRes = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_PERU_TOKEN}`
            }
        });

        const apiData = await apiRes.json();

        if (apiData.success) {
            const result = apiData.data;
            return NextResponse.json({
                source: 'external',
                data: {
                    codcli: 'NUEVO', // Marcamos como nuevo para registrar luego
                    nomcli: isRuc ? result.nombre_o_razon_social : `${result.nombre_completo}`,
                    ruccli: isRuc ? q : '',
                    nrodni: isRuc ? '' : q,
                    address: result.direccion_completa || ''
                }
            });
        }

        return NextResponse.json({ error: 'No encontrado en ninguna fuente' }, { status: 404 });

    } catch (err) {
        console.error('Customer search error:', err);
        return NextResponse.json({ error: 'Error interno', details: err.message }, { status: 500 });
    }
}
