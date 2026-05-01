import { getConnection } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    const pool = await getConnection();
    
    // Querying prd0101 for products
    // We filter by description or code if 'q' is provided
    let sqlQuery = `
      SELECT TOP 50 
        codf as code, 
        descr as name, 
        marc as brand, 
        umed as unit, 
        pvns as price, 
        stoc as stock
      FROM prd0101
      WHERE 1=1
    `;
    
    if (query) {
      sqlQuery += ` AND (descr LIKE '%${query}%' OR codf LIKE '%${query}%')`;
    }
    
    sqlQuery += ` ORDER BY descr ASC`;
    
    const result = await pool.request().query(sqlQuery);
    
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
