import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
    try {
        console.log('[API] Fetching companies from BdNavaSys...');
        
        // El dashboard oficial usa BdNavaSys para listar empresas
        const pool = await getConnection('BdNavaSys');
        
        const result = await pool.request()
            .query("SELECT codcia, nomcia FROM sysnavacia WHERE estado = 1 AND codcia <> '00'");
        
        console.log(`[API] Found ${result.recordset.length} companies`);

        const companies = result.recordset.map(c => ({
            id: c.codcia,
            code: (c.codcia || '').trim(),
            name: (c.nomcia || '').trim().toUpperCase(),
            // La base de datos sigue el patrón BdNava + codcia (ej: BdNava01)
            database: `BdNava${(c.codcia || '').trim()}`
        }));

        return NextResponse.json(companies);
    } catch (err) {
        console.error('[API] Error fetching companies from BdNavaSys:', err.message);
        
        // Fallback a BdNava01 si falla BdNavaSys
        try {
            console.log('[API] Falling back to BdNava01 for companies...');
            const pool = await getConnection('BdNava01');
            const result = await pool.request().query("SELECT * FROM confemp01 WHERE Codigo IS NOT NULL");
            const companies = result.recordset.map(c => ({
                id: c.EmpresaId || c.id || 0,
                code: (c.Codigo || '').trim(),
                name: (c.Codigo || '').trim().toUpperCase(),
                database: (c.Base || '').trim()
            }));
            return NextResponse.json(companies);
        } catch (innerErr) {
            return NextResponse.json({ 
                error: 'Error interno del servidor', 
                details: innerErr.message 
            }, { status: 500 });
        }
    }
}
