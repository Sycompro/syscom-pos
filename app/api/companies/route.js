import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
    try {
        console.log('[API] Fetching companies from master DB...');
        // Forzamos el nombre de la DB maestra si no viene de env
        const masterDb = process.env.DB_NAME_MASTER || 'BdNava01';
        const pool = await getConnection(masterDb);
        
        const result = await pool.request()
            .query("SELECT * FROM confemp01 WHERE Codigo IS NOT NULL");
        
        console.log(`[API] Found ${result.recordset.length} companies`);

        const companies = result.recordset.map(c => ({
            id: c.EmpresaId || c.id || 0,
            code: (c.Codigo || '').trim(),
            name: (c.Codigo || '').trim().toUpperCase(),
            database: (c.Base || '').trim()
        }));

        return NextResponse.json(companies);
    } catch (err) {
        console.error('[API] Error fetching companies:', err.message);
        return NextResponse.json({ 
            error: 'Error interno del servidor', 
            details: err.message,
            stack: err.stack 
        }, { status: 500 });
    }
}
