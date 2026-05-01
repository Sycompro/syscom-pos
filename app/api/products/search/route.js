import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const alm = searchParams.get('alm') || '01';

    if (!query || query.length < 3) return NextResponse.json([]);

    try {
        const pool = await getConnection();
        
        // El campo de stock es stk + código de almacén con 2 dígitos
        const stockField = `stk${alm.padStart(2, '0')}`;

        const result = await pool.request()
            .input('query', sql.VarChar(100), `%${query}%`)
            .query(`
                SELECT TOP 20 
                    codi as id, 
                    descr as name, 
                    pre1 as price, 
                    ${stockField} as stock 
                FROM prd0101 
                WHERE (descr LIKE @query OR codi LIKE @query)
                AND flag <> '*'
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
