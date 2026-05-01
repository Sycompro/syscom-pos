import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
    try {
        const pool = await getConnection();
        // Solo columnas que existen: EmpresaId, Codigo, Base
        const result = await pool.request()
            .query("SELECT EmpresaId, Codigo, Base FROM confemp01 WHERE Codigo IS NOT NULL ORDER BY EmpresaId");
        
        const companies = result.recordset.map(c => ({
            id: c.EmpresaId,
            code: c.Codigo.trim(),
            name: c.Codigo.trim().toUpperCase(), // Usamos el código como nombre temporalmente
            database: c.Base.trim()
        }));

        return NextResponse.json(companies);
    } catch (err) {
        console.error('Error fetching companies:', err);
        return NextResponse.json([], { status: 500 }); // Retornar vacío si hay error
    }
}
