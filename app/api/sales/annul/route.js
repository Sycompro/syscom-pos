import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getStockTableName, getStockColumnName } from '@/lib/erp-utils';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { cdocu, ndocu, codanu } = body;

        if (!cdocu || !ndocu) {
            return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
        }

        const pool = await getConnection(session.user.company);
        
        // 1. Obtener datos para la reversión
        const checkRes = await pool.request()
            .input('cdocu', sql.Char(2), cdocu)
            .input('ndocu', sql.Char(12), ndocu)
            .query("SELECT flag, CodAlm FROM mst01fac WHERE cdocu = @cdocu AND ndocu = @ndocu");

        if (checkRes.recordset.length === 0) {
            return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
        }

        if (checkRes.recordset[0].flag === '*') {
            return NextResponse.json({ error: 'Documento ya está anulado' }, { status: 400 });
        }

        const warehouse = checkRes.recordset[0].CodAlm.trim();
        const stockField = getStockColumnName(warehouse);
        const prdTable = getStockTableName(warehouse);

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 2. Anulación física en ERP (Flag '*')
            await transaction.request()
                .input('cdocu', sql.Char(2), cdocu)
                .input('ndocu', sql.Char(12), ndocu)
                .query("UPDATE mst01fac SET flag = '*' WHERE cdocu = @cdocu AND ndocu = @ndocu");

            await transaction.request()
                .input('cdocu', sql.Char(2), cdocu)
                .input('ndocu', sql.Char(12), ndocu)
                .query("UPDATE dtl01fac SET flag = '*' WHERE cdocu = @cdocu AND ndocu = @ndocu");

            await transaction.request()
                .input('cdocu', sql.Char(2), cdocu)
                .input('ndocu', sql.Char(12), ndocu)
                .query("UPDATE mst01ccc SET flag = '*' WHERE cdocu = @cdocu AND ndocu = @ndocu");

            // 2.5 Reversión de cobros/amortizaciones asociadas al documento anulado
            // Buscar en dtl01cob si existen recibos de pago que referencian este documento
            const cobrosRes = await transaction.request()
                .input('crefe', sql.Char(2), cdocu)
                .input('nrefe', sql.Char(12), ndocu)
                .query(`
                    SELECT DISTINCT d.cdocu AS cobCdocu, d.ndocu AS cobNdocu, d.monto AS cobMonto
                    FROM dtl01cob d
                    INNER JOIN mst01cob m ON m.cdocu = d.cdocu AND m.ndocu = d.ndocu
                    WHERE d.crefe = @crefe AND d.nrefe = @nrefe AND ISNULL(m.flaganu, 0) = 0
                `);

            const cobrosAnulados = cobrosRes.recordset.length;

            if (cobrosAnulados > 0) {
                console.log(`[Annul] Detectados ${cobrosAnulados} cobro(s) asociados al doc ${cdocu}-${ndocu}. Procediendo a anularlos.`);

                for (const cobro of cobrosRes.recordset) {
                    // A. Marcar el recibo de cobro como anulado en mst01cob
                    await transaction.request()
                        .input('cobCdocu', sql.Char(2), cobro.cobCdocu)
                        .input('cobNdocu', sql.Char(12), cobro.cobNdocu)
                        .query(`UPDATE mst01cob SET flaganu = 1 WHERE cdocu = @cobCdocu AND ndocu = @cobNdocu`);

                    // B. Marcar los movimientos de abono en dtl01ccc relacionados a este recibo
                    await transaction.request()
                        .input('cobCdocu', sql.Char(2), cobro.cobCdocu)
                        .input('cobNdocu', sql.Char(12), cobro.cobNdocu)
                        .input('crefe', sql.Char(2), cdocu)
                        .input('nrefe', sql.Char(12), ndocu)
                        .query(`
                            UPDATE dtl01ccc SET abono = 0 
                            WHERE cdocu = @cobCdocu AND ndocu = @cobNdocu 
                            AND crefe = @crefe AND nrefe = @nrefe AND tmov = 'A'
                        `);

                    console.log(`[Annul] Cobro ${cobro.cobCdocu}-${cobro.cobNdocu} (S/ ${cobro.cobMonto}) anulado.`);
                }
            }

            // 3. Reversión de Stock Dinámica
            const itemsRes = await transaction.request()
                .input('cdocu', sql.Char(2), cdocu)
                .input('ndocu', sql.Char(12), ndocu)
                .query("SELECT codi, cant FROM dtl01fac WHERE cdocu = @cdocu AND ndocu = @ndocu");

            for (const item of itemsRes.recordset) {
                await transaction.request()
                    .input('codi', sql.Char(11), item.codi)
                    .input('cant', sql.Float, item.cant)
                    .query(`
                        -- Revertir en tabla específica (solo si no es prd0101 para evitar duplicidad en stoc)
                        IF '${prdTable}' <> 'prd0101'
                        BEGIN
                            DECLARE @table_exists INT;
                            SELECT @table_exists = COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${prdTable}';
                            IF @table_exists > 0
                            BEGIN
                                DECLARE @sql NVARCHAR(MAX) = N'UPDATE ${prdTable} SET stoc = stoc + @cant WHERE codi = @codi';
                                EXEC sp_executesql @sql, N'@cant FLOAT, @codi CHAR(11)', @cant, @codi;
                            END
                        END
                        -- Revertir en consolidado
                        UPDATE prd0101 SET ${stockField} = ${stockField} + @cant, stoc = stoc + @cant WHERE codi = @codi
                    `);
                
                // Anular en Kardex
                const kardexTable = `kdd01${warehouse.padStart(2, '0')}`;
                try {
                    await transaction.request()
                        .input('cdocu', sql.Char(2), cdocu)
                        .input('ndocu', sql.Char(12), ndocu)
                        .input('codi', sql.Char(11), item.codi)
                        .query(`UPDATE ${kardexTable} SET cant = 0, tota = 0 WHERE cdocu = @cdocu AND ndocu = @ndocu AND codi = @codi`);
                } catch (e) {}
            }

            // 4. Auditoría de Anulación
            await transaction.request()
                .input('cdocu', sql.Char(2), cdocu)
                .input('ndocu', sql.Char(12), ndocu)
                .input('codanu', sql.Char(2), codanu || '01')
                .input('usuario', sql.VarChar(20), session.user.username.substring(0, 20))
                .query(`
                    INSERT INTO Dtl_Anulacion_Doc (cdocu, ndocu, CodAnu, Fecha, maquina, usuarionav)
                    VALUES (@cdocu, @ndocu, @codanu, GETDATE(), 'WEB_POS', @usuario)
                `);

            await transaction.commit();
            return NextResponse.json({ 
                success: true, 
                message: cobrosAnulados > 0 
                    ? `Anulación completa. Se revirtieron ${cobrosAnulados} cobro(s) asociado(s).`
                    : 'Anulación completa procesada',
                cobrosRevertidos: cobrosAnulados
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('[API Sales Annul] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
