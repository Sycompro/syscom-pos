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
                        -- Revertir en tabla específica
                        DECLARE @table_exists INT;
                        SELECT @table_exists = COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${prdTable}';
                        IF @table_exists > 0
                        BEGIN
                            DECLARE @sql NVARCHAR(MAX) = N'UPDATE ${prdTable} SET stoc = stoc + @cant WHERE codi = @codi';
                            EXEC sp_executesql @sql, N'@cant FLOAT, @codi CHAR(11)', @cant, @codi;
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
            return NextResponse.json({ success: true, message: 'Anulación completa procesada' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('[API Sales Annul] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
