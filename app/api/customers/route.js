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
        const filter = (searchParams.get('filter') || 'all').trim();

        const pool = await getConnection(session.user.company);

        // Construimos la consulta base con el LEFT JOIN de deudas
        let baseQuery = `
            SELECT TOP 50 
                c.codcli, 
                c.nomcli, 
                c.ruccli, 
                c.nrodni, 
                c.dircli, 
                c.celcli, 
                c.telcli, 
                c.email, 
                c.fecnac,
                c.fecfinpres,
                ISNULL(c.mcredi, 0) as mcredi,
                ISNULL(d.deuda, 0) as deuda
            FROM mst01cli c WITH(nolock)
            LEFT JOIN (
                SELECT codcli, SUM(saldo) as deuda
                FROM mst01ccc WITH(nolock)
                WHERE saldo > 0 AND flag <> '*'
                GROUP BY codcli
            ) d ON c.codcli = d.codcli
        `;

        let conditions = [];
        const req = pool.request();

        if (query.length > 0) {
            conditions.push(`(c.nomcli LIKE @query OR c.ruccli LIKE @query OR c.nrodni LIKE @query OR c.codcli LIKE @query)`);
            req.input('query', sql.VarChar(100), `%${query}%`);
        }

        if (filter === 'credit') {
            conditions.push(`ISNULL(c.mcredi, 0) > 0`);
        } else if (filter === 'debt') {
            conditions.push(`ISNULL(d.deuda, 0) > 0`);
        }

        if (conditions.length > 0) {
            baseQuery += ` WHERE ` + conditions.join(' AND ');
        }

        if (filter === 'debt') {
            baseQuery += ` ORDER BY d.deuda DESC`; // Ordenar por mayor deuda si es ese filtro
        } else {
            baseQuery += ` ORDER BY c.nomcli ASC`;
        }

        const result = await req.query(baseQuery);

        const customers = result.recordset.map(c => {
            const limit = Number(c.mcredi) || 0;
            const debt = Number(c.deuda) || 0;
            const available = Number(Math.max(0, limit - debt).toFixed(2));
            return {
                codcli: (c.codcli || '').toString().trim(),
                nomcli: (c.nomcli || '').toString().trim(),
                ruccli: (c.ruccli || c.nrodni || '').toString().trim(),
                nrodni: (c.nrodni || '').toString().trim(),
                dircli: (c.dircli || '').toString().trim(),
                celcli: (c.celcli || c.telcli || '').toString().trim(),
                email: (c.email || '').toString().trim(),
                fecnac: c.fecnac ? new Date(c.fecnac).toISOString().split('T')[0] : '',
                fecfinpres: c.fecfinpres && c.fecfinpres.getFullYear() > 1900 ? c.fecfinpres.toISOString() : null,
                mcredi: limit,
                deuda: debt,
                disponible: available
            };
        });

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
