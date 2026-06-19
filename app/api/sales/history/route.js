import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const idApeCaj = searchParams.get('idApeCaj');
    const dateParam = searchParams.get('date');

    if (!idApeCaj && !dateParam) {
        return NextResponse.json({ error: 'Falta idApeCaj o date' }, { status: 400 });
    }

    try {
        const pool = await getConnection(session?.user?.company);
        let sessionInfo = null;

        // 1. Obtener detalles de la sesión de caja si viene idApeCaj
        if (idApeCaj) {
            const sessionRes = await pool.request()
                .input('idApeCaj', sql.Int, idApeCaj)
                .query("SELECT TOP 1 fecape, hora, apesol FROM dtl_restpos_apecaj WHERE idapecaj = @idApeCaj");
            
            sessionInfo = sessionRes.recordset[0] ? {
                openingDate: sessionRes.recordset[0].fecape,
                openingTime: sessionRes.recordset[0].hora,
                openingAmount: sessionRes.recordset[0].apesol
            } : null;
        }

        // 2. Obtener lista de ventas
        const salesRequest = pool.request();
        let queryStr = "";

        if (idApeCaj) {
            salesRequest.input('idApeCaj', sql.Int, idApeCaj);
            queryStr = `
                SELECT 
                    f.ndocu, f.cdocu, f.nomcli, f.ruccli, 
                    CAST(f.totn AS FLOAT) as tota, 
                    f.fecha, f.FecReg, f.flag, f.selpago, f.codven, f.codfdp,
                    f.efact, f.efactcode, f.efactcdr,
                    CONVERT(VARCHAR(8), f.FecReg, 108) as hora_real,
                    CONVERT(VARCHAR(10), f.FecReg, 103) as fecha_real,
                    c.fecfinpres,
                    COALESCE(NULLIF(f.observ, ''), NULLIF(c.celcli, ''), NULLIF(c.telcli, ''), '') as phone
                FROM mst01fac f WITH(nolock)
                LEFT JOIN mst01cli c WITH(nolock) ON f.codcli = c.codcli
                WHERE f.idapecaj = @idApeCaj 
                ORDER BY f.FecReg DESC
            `;
        } else {
            const startStr = `${dateParam} 00:00:00`;
            const endStr = `${dateParam} 23:59:59`;
            salesRequest.input('start', sql.VarChar(30), startStr);
            salesRequest.input('end', sql.VarChar(30), endStr);
            queryStr = `
                SELECT 
                    f.ndocu, f.cdocu, f.nomcli, f.ruccli, 
                    CAST(f.totn AS FLOAT) as tota, 
                    f.fecha, f.FecReg, f.flag, f.selpago, f.codven, f.codfdp,
                    f.efact, f.efactcode, f.efactcdr,
                    CONVERT(VARCHAR(8), f.FecReg, 108) as hora_real,
                    CONVERT(VARCHAR(10), f.FecReg, 103) as fecha_real,
                    c.fecfinpres,
                    COALESCE(NULLIF(f.observ, ''), NULLIF(c.celcli, ''), NULLIF(c.telcli, ''), '') as phone
                FROM mst01fac f WITH(nolock)
                LEFT JOIN mst01cli c WITH(nolock) ON f.codcli = c.codcli
                WHERE f.fecha >= CONVERT(DATETIME, @start, 120) AND f.fecha <= CONVERT(DATETIME, @end, 120)
                ORDER BY f.FecReg DESC
            `;
        }

        const salesRes = await salesRequest.query(queryStr);

        const sales = salesRes.recordset.map(s => {
            let sunatStatus = 'NO APLICA';
            let sunatColor = '#94a3b8';

            if (s.cdocu === '01' || s.cdocu === '03') {
                const cdr = Number(s.efactcdr);
                const code = (s.efactcode || '').trim();

                if (cdr === 1 || code === '0') {
                    sunatStatus = 'ACEPTADO';
                    sunatColor = '#10b981';
                } else if (cdr === -1 || (code !== '' && code !== '0')) {
                    sunatStatus = `RECHAZADO [${code}]`;
                    sunatColor = '#ef4444';
                } else {
                    sunatStatus = 'PENDIENTE';
                    sunatColor = '#f59e0b';
                }
            }

            return {
                ...s,
                status: (s.flag === '9' || s.flag === '*') ? 'ANULADO' : 'ACTIVO',
                paymentType: s.selpago === 1 ? 'EFECTIVO' : (s.selpago === 4 ? 'MIXTO' : 'TARJETA'),
                sunatStatus,
                sunatColor
            };
        });

        return NextResponse.json({
            sales,
            sessionInfo
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
