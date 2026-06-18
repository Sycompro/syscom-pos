import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = (searchParams.get('q') || '').trim();

        const pool = await getConnection(session.user.company);

        let result;
        if (query.length > 0) {
            // Buscar por coincidencia parcial en nombre, ruc, dni o código
            result = await pool.request()
                .input('query', sql.VarChar(100), `%${query}%`)
                .query(`
                    SELECT TOP 50 
                        codcli, 
                        nomcli, 
                        ruccli, 
                        nrodni, 
                        dircli, 
                        celcli, 
                        telcli, 
                        email, 
                        fecnac,
                        fecfinpres,
                        ISNULL(mcredi, 0) as mcredi
                    FROM mst01cli
                    WHERE nomcli LIKE @query
                       OR ruccli LIKE @query
                       OR nrodni LIKE @query
                       OR codcli LIKE @query
                    ORDER BY nomcli ASC
                `);
        } else {
            // Mostrar los primeros 50 clientes por defecto
            result = await pool.request()
                .query(`
                    SELECT TOP 50 
                        codcli, 
                        nomcli, 
                        ruccli, 
                        nrodni, 
                        dircli, 
                        celcli, 
                        telcli, 
                        email, 
                        fecnac,
                        fecfinpres,
                        ISNULL(mcredi, 0) as mcredi
                    FROM mst01cli
                    ORDER BY nomcli ASC
                `);
        }

        const customers = result.recordset.map(c => ({
            codcli: (c.codcli || '').toString().trim(),
            nomcli: (c.nomcli || '').toString().trim(),
            ruccli: (c.ruccli || c.nrodni || '').toString().trim(),
            nrodni: (c.nrodni || '').toString().trim(),
            dircli: (c.dircli || '').toString().trim(),
            celcli: (c.celcli || c.telcli || '').toString().trim(),
            email: (c.email || '').toString().trim(),
            fecnac: c.fecnac ? new Date(c.fecnac).toISOString().split('T')[0] : '',
            fecfinpres: c.fecfinpres && c.fecfinpres.getFullYear() > 1900 ? c.fecfinpres.toISOString() : null,
            mcredi: Number(c.mcredi) || 0
        }));

        return NextResponse.json({ success: true, data: customers });

    } catch (err) {
        console.error('[API/Customers] Error listing customers:', err);
        return NextResponse.json({ 
            success: false, 
            error: 'Error al obtener el listado de clientes',
            details: err.message 
        }, { status: 500 });
    }
}
