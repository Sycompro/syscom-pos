import { NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const idapecaj = searchParams.get('idapecaj');

        if (!idapecaj) {
            return NextResponse.json({ success: false, error: 'ID de apertura requerido' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const pool = await getConnection(session?.user?.company);

        // 1. Datos de Apertura y Empresa
        const headerRes = await pool.request()
            .input('id', sql.Int, idapecaj)
            .query(`
                SELECT a.apesol, a.fecape, a.hora, a.codusu, a.codpto, a.nropla,
                       (SELECT TOP 1 RazonSocial FROM Empresa) as nomemp,
                       (SELECT TOP 1 Ruc FROM Empresa) as rucemp,
                       (SELECT TOP 1 Direccion FROM Empresa) as diremp
                FROM dtl_restpos_apecaj a
                WHERE a.idapecaj = @id
            `);
        
        const header = headerRes.recordset[0];
        if (!header) return NextResponse.json({ success: false, error: 'Sesión no encontrada' }, { status: 404 });

        // 2. Desglose de Ventas por Condición (Contado vs Crédito)
        const condRes = await pool.request()
            .input('id', sql.Int, idapecaj)
            .query(`
                SELECT 
                    CASE WHEN LTRIM(RTRIM(codcdv)) = '02' THEN 'Crédito' ELSE 'Contado' END as condicion,
                    SUM(totn) as total,
                    COUNT(*) as cantidad
                FROM mst01fac 
                WHERE idapecaj = @id AND estado <> 'V'
                GROUP BY codcdv
            `);

        // 3. Desglose de Pagos (Sección 2 del reporte)
        const paymentsRes = await pool.request()
            .input('id', sql.Int, idapecaj)
            .query(`
                -- Pagos Digitales desde Cobranza Mixta
                SELECT 
                    ISNULL(t.nomtar, 'OTROS') as method,
                    SUM(c.totn) as total
                FROM dtl_restpos_cobmixta c
                LEFT JOIN tbl01tar t ON c.codtar = t.codtar
                INNER JOIN mst01fac f ON c.ndocu = f.ndocu AND c.cdocu = f.cdocu
                WHERE f.idapecaj = @id AND c.codtar <> 'NS'
                GROUP BY t.nomtar
                
                UNION ALL
                
                -- Efectivo Directo (Ventas que no están en cobranza mixta o son NS)
                SELECT 'EFECTIVO' as method, SUM(totn) as total
                FROM mst01fac m
                WHERE idapecaj = @id AND estado <> 'V' AND NOT EXISTS (
                    SELECT 1 FROM dtl_restpos_cobmixta c 
                    WHERE c.ndocu = m.ndocu AND c.cdocu = m.cdocu AND c.codtar <> 'NS'
                )
                HAVING SUM(totn) > 0
            `);

        // 4. Conteo de Documentos (Sección Docs Emitidos)
        const docsRes = await pool.request()
            .input('id', sql.Int, idapecaj)
            .query(`
                SELECT 
                    f.cdocu,
                    ISNULL(d.nomdoc, 'OTROS') as docName,
                    COUNT(*) as quantity,
                    MIN(f.ndocu) as rangeStart,
                    MAX(f.ndocu) as rangeEnd,
                    SUM(f.totn) as total
                FROM mst01fac f
                LEFT JOIN tbl01doc d ON f.cdocu = d.cdocu
                WHERE f.idapecaj = @id AND f.estado <> 'V'
                GROUP BY f.cdocu, d.nomdoc
            `);

        // 5. Anulados
        const nullRes = await pool.request()
            .input('id', sql.Int, idapecaj)
            .query(`
                SELECT COUNT(*) as quantity, SUM(totn) as total 
                FROM mst01fac 
                WHERE idapecaj = @id AND estado = 'V'
            `);

        // 6. Venta por Líneas con Porcentajes
        const totalVta = condRes.recordset.reduce((acc, curr) => acc + curr.total, 0);
        const linesRes = await pool.request()
            .input('id', sql.Int, idapecaj)
            .query(`
                SELECT 
                    ISNULL(fam.nomsub, 'OTROS') as category,
                    SUM(d.totn) as total,
                    COUNT(*) as itemsSold
                FROM dtl01fac d
                INNER JOIN mst01fac m ON d.ndocu = m.ndocu AND d.cdocu = m.cdocu
                LEFT JOIN prd0101 p ON d.codi = p.codi
                LEFT JOIN tbl01sbf fam ON LTRIM(RTRIM(fam.codsub)) = LEFT(p.codi, 2) + '-' + LTRIM(RTRIM(p.codcat))
                WHERE m.idapecaj = @id AND m.estado <> 'V'
                GROUP BY fam.nomsub
            `);
        
        const lineBreakdown = linesRes.recordset.map(l => ({
            ...l,
            percentage: totalVta > 0 ? (l.total / totalVta) * 100 : 0
        }));

        // 7. Egresos
        const expRes = await pool.request()
            .input('id', sql.Int, idapecaj)
            .query('SELECT ISNULL(SUM(monto), 0) as total FROM dtl_restpos_egrcaja WHERE idapecaj = @id');

        return NextResponse.json({
            success: true,
            summary: {
                header: {
                    company: header.nomemp,
                    ruc: header.rucemp,
                    address: header.diremp,
                    pointOfSale: header.codpto,
                    user: header.codusu,
                    date: header.fecape,
                    hour: header.hora,
                    nropla: header.nropla
                },
                liquidation: condRes.recordset,
                payments: paymentsRes.recordset,
                documents: docsRes.recordset,
                nullified: nullRes.recordset[0],
                lines: lineBreakdown,
                opening: header.apesol,
                expenses: expRes.recordset[0].total,
                totalSales: totalVta
            }
        });

    } catch (error) {
        console.error('[API/CashSummary] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
