import { getConnection } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import sql from 'mssql';
import { getWarehouseForSede, getStockTableName, getStockColumnName } from '@/lib/erp-utils';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const company = session.user.company;
    const { searchParams } = new URL(request.url);
    const codi = searchParams.get('codi');

    if (!codi) {
      return NextResponse.json({ error: 'El código de producto (codi) es requerido' }, { status: 400 });
    }

    const pool = await getConnection(company);

    // 1. Obtener todas las sedes activas del ERP
    const sedesRes = await pool.request().query(`
        SELECT LTRIM(RTRIM(codpto)) as codpto, LTRIM(RTRIM(nompto)) as nompto, LTRIM(RTRIM(codtie)) as codtie 
        FROM tbl01pto 
        WHERE estado = 1
    `);

    const sedes = sedesRes.recordset;
    const stockResults = [];

    // 2. Consultar el stock para cada sede de forma segura
    for (const sede of sedes) {
      const warehouse = await getWarehouseForSede(pool, sede.codpto);
      const prdTable = getStockTableName(warehouse);
      const stockField = getStockColumnName(warehouse);
      
      let stock = 0;

      try {
        if (warehouse === '01') {
          const query = await pool.request()
            .input('codi', sql.VarChar(20), codi)
            .query("SELECT ISNULL(stoc, 0) as stock FROM prd0101 WITH(nolock) WHERE LTRIM(RTRIM(codi)) = LTRIM(RTRIM(@codi))");
          if (query.recordset.length > 0) {
            stock = query.recordset[0].stock;
          }
        } else {
          // Consultar dinámicamente si existe la tabla de la sucursal
          const query = await pool.request()
            .input('codi', sql.VarChar(20), codi)
            .query(`
              DECLARE @table_exists INT;
              SELECT @table_exists = COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${prdTable}';

              IF @table_exists > 0
                BEGIN
                  SELECT ISNULL(stoc, 0) as stock FROM ${prdTable} WITH(nolock) WHERE LTRIM(RTRIM(codi)) = LTRIM(RTRIM(@codi))
                END
              ELSE
                BEGIN
                  SELECT ISNULL(${stockField}, 0) as stock FROM prd0101 WITH(nolock) WHERE LTRIM(RTRIM(codi)) = LTRIM(RTRIM(@codi))
                END
            `);
          
          if (query.recordset.length > 0) {
            stock = query.recordset[0].stock;
          }
        }
      } catch (err) {
        console.error(`[StockSedes] Error consultando stock para sede ${sede.codpto} (${sede.nompto}):`, err);
        // Dejar stock en 0 si falla
      }

      stockResults.push({
        sedeId: sede.codpto,
        name: sede.nompto,
        warehouse: warehouse,
        stock: stock
      });
    }

    return NextResponse.json(stockResults);

  } catch (error) {
    console.error('[API Products Stock Sedes] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
