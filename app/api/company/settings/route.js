import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    try {
        const pool = await getConnection(session?.user?.company);
        
        // 1. Obtener datos globales de la Cia (Emisor) desde la Base de Datos Maestra (BdNavaSys)
        let emisor = { nomcia: 'MI EMPRESA', ruccia: '', dircia: '' };
        try {
            const masterPool = await getConnection('BdNavaSys');
            // Extraer el código de empresa de la base de datos actual (ej: 'BdNava03' -> '03')
            const dbCode = session?.user?.company?.replace('BdNava', '').padStart(2, '0') || '01';
            
            const sysRes = await masterPool.request()
                .input('code', sql.Char(3), dbCode)
                .query("SELECT nomcia, ruccia, dircia FROM sysnavacia WHERE codcia LIKE @code + '%'");
            
            if (sysRes.recordset.length > 0) {
                emisor = sysRes.recordset[0];
            }
        } catch (e) {
            console.warn("[Settings] Error consultando BdNavaSys, intentando local:", e.message);
            // Fallback a tabla local si la maestra falla
            const emisorRes = await pool.request()
                .query("SELECT TOP 1 ruccia, nomcia, dircia, telcia, email FROM tbl_enavasoft_emisor");
            if (emisorRes.recordset.length > 0) emisor = emisorRes.recordset[0];
        }

        // 2. Obtener datos de la Sede/Punto de Venta actual del usuario
        const sedeCode = session.user.sedeId || '01';
        const sedeRes = await pool.request()
            .input('codpto', sql.Char(6), sedeCode)
            .query(`
                SELECT P.nompto, T.DirTie, T.TelTie 
                FROM tbl01pto P
                LEFT JOIN tbl_tienda T ON P.codtie = T.codtie
                WHERE P.codpto = @codpto
            `);
        
        const sede = sedeRes.recordset[0] || {};

        return NextResponse.json({
            company: {
                name: emisor.nomcia?.trim() || 'MI EMPRESA',
                ruc: emisor.ruccia?.trim() || '',
                address: sede.DirTie?.trim() || emisor.dircia?.trim() || '',
                phone: sede.TelTie?.trim() || emisor.telcia?.trim() || '',
                email: emisor.email?.trim() || ''
            },
            pointOfSale: {
                name: sede.nompto?.trim() || 'SUCURSAL PRINCIPAL',
                code: sedeCode
            }
        });
    } catch (err) {
        console.error('Error fetching company settings:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
