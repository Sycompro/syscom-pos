import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const alm = searchParams.get('alm') || '01';

    // Si no hay query, cargamos el top 50 de productos para no dejar la pantalla vacía
    const isInitialLoad = !query || query.length === 0;
    const searchQuery = isInitialLoad ? '%' : `%${query}%`;

    try {
        const pool = await getConnection();
        
        // El campo de stock es stk + código de almacén con 2 dígitos
        const stockField = `stk${alm.padStart(2, '0')}`;

        const result = await pool.request()
            .input('searchQuery', sql.VarChar(100), searchQuery)
            .query(`
                SELECT TOP 50 
                    RTRIM(codi) as id, 
                    RTRIM(descr) as name, 
                    pvns as price, 
                    ${stockField} as stock 
                FROM prd0101 
                WHERE (descr LIKE @searchQuery OR codi LIKE @searchQuery OR codf LIKE @searchQuery)
                AND estado = 1 -- Solo productos activos
            `);

        const products = result.recordset.map(r => ({
            id: r.id.trim(),
            name: r.name.trim(),
            price: r.price,
            stock: r.stock
        }));

        return NextResponse.json(products);

    } catch (err) {
        console.error('Product search error:', err);
        return NextResponse.json({ error: 'Error en la búsqueda de productos' }, { status: 500 });
    }
}
