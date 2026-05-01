import { getConnection } from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const pool = await getConnection();
    
    // Fetching last 10 sales from mst01fac
    const result = await pool.request().query(`
      SELECT TOP 10 
        fecha as date, 
        cdocu as type, 
        ndocu as number, 
        nomcli as client, 
        totn as total, 
        mone as currency
      FROM mst01fac
      ORDER BY fecha DESC, FecReg DESC
    `);
    
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
