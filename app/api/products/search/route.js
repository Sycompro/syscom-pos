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
    const sedeId = session.user.sedeId;
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const pool = await getConnection(company);
    
    // 1. Determinar el almacén de forma INFALIBLE
    const urlAlm = searchParams.get('alm');
    // Siempre intentamos resolverlo para normalizar (ej: "PUNTO 03" -> "03")
    const warehouse = await getWarehouseForSede(pool, urlAlm || sedeId);
    
    const stockField = getStockColumnName(warehouse);
    const prdTable = getStockTableName(warehouse);
    
    // 2. Construir la cláusula WHERE para filtros (Búsqueda + Categoría usando alias p01 de la maestra)
    let filters = "p01.estado = 1";
    if (query) {
        filters += ` AND (p01.descr LIKE '%${query}%' OR p01.codi LIKE '%${query}%' OR p01.codf LIKE '%${query}%')`;
    }
    if (category && category !== 'Todos' && category !== 'all') {
        filters += ` AND LTRIM(RTRIM(p01.codcat)) = RIGHT('${category}', 2) AND LEFT(p01.codi, 2) = LEFT('${category}', 2)`;
    }

    // 3. Consulta INTELIGENTE (Espejo homologado de psventa.exe)
    console.log(`[DEBUG/Products] Sede: ${sedeId}, Warehouse: ${warehouse}, Table: ${prdTable}, Col: ${stockField}`);

    let sqlQuery = "";
    if (warehouse === '01') {
        // En Almacén 01, la verdad siempre es prd0101.stoc
        sqlQuery = `
            SELECT TOP 50 
                RTRIM(p01.codi) as id, RTRIM(p01.codf) as userCode, RTRIM(p01.descr) as name, 
                RTRIM(p01.marc) as brand, RTRIM(p01.umed) as unit, p01.pvns as price, 
                p01.stoc as stock, RTRIM(p01.Usr_003) as membershipDays
            FROM prd0101 p01 WITH(nolock)
            WHERE ${filters}
            ORDER BY p01.descr ASC
        `;
    } else {
        sqlQuery = `
            DECLARE @table_exists INT;
            SELECT @table_exists = COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${prdTable}';

            IF @table_exists > 0
                BEGIN
                    SELECT TOP 50 
                        RTRIM(p01.codi) as id, RTRIM(p01.codf) as userCode, RTRIM(p01.descr) as name, 
                        RTRIM(p01.marc) as brand, RTRIM(p01.umed) as unit, 
                        CASE WHEN ISNULL(p02.pvns, 0) = 0 THEN p01.pvns ELSE p02.pvns END as price, 
                        ISNULL(p02.stoc, 0) as stock, RTRIM(p01.Usr_003) as membershipDays
                    FROM ${prdTable} p02 WITH(nolock)
                    INNER JOIN prd0101 p01 WITH(nolock) ON p01.codi = p02.codi
                    WHERE ${filters}
                    ORDER BY p01.descr ASC
                END
            ELSE
                BEGIN
                    SELECT TOP 50 
                        RTRIM(p01.codi) as id, RTRIM(p01.codf) as userCode, RTRIM(p01.descr) as name, 
                        RTRIM(p01.marc) as brand, RTRIM(p01.umed) as unit, p01.pvns as price, 
                        ISNULL(p01.${stockField}, 0) as stock, RTRIM(p01.Usr_003) as membershipDays
                    FROM prd0101 p01 WITH(nolock)
                    WHERE ${filters}
                    ORDER BY p01.descr ASC
                END
        `;
    }
    
    const result = await pool.request().query(sqlQuery);
    
    const products = result.recordset.map(r => ({
        id: r.id.trim(),
        userCode: r.userCode?.trim() || '',
        name: r.name.trim(),
        brand: r.brand?.trim() || '',
        unit: r.unit?.trim() || 'UND',
        price: r.price,
        stock: r.stock,
        membershipDays: parseInt(r.membershipDays || '0', 10)
    }));

    return NextResponse.json(products);

  } catch (error) {
    console.error('[API Products Search] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
