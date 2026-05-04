import sql from 'mssql';

/**
 * Utilidades centralizadas para integración con Navasoft ERP
 */

export const ERP_CONFIG = {
    TAX_RATE: 1.18,
    DEFAULT_WAREHOUSE: '01',
    DEFAULT_SEDE: '01'
};

/**
 * Resuelve el almacén (codalm) asignado a una sede (codpto)
 */
export async function getWarehouseForSede(pool, sedeId) {
    if (!sedeId) return ERP_CONFIG.DEFAULT_WAREHOUSE;
    
    try {
        const ptoRes = await pool.request()
            .input('codpto', sql.VarChar(10), sedeId)
            .query("SELECT codtie FROM tbl01pto WHERE LTRIM(RTRIM(codpto)) = LTRIM(RTRIM(@codpto))");
        
        if (ptoRes.recordset.length > 0) {
            const codtie = ptoRes.recordset[0].codtie.trim();
            const almRes = await pool.request()
                .input('codtie', sql.Char(3), codtie)
                .query("SELECT TOP 1 codalm FROM tbl01Alm WHERE codtie = @codtie");
            
            if (almRes.recordset.length > 0) {
                return almRes.recordset[0].codalm.trim();
            }
            // Fallback: usar los últimos 2 dígitos de la tienda
            return codtie.slice(-2);
        }
    } catch (error) {
        console.error('[ERP Utils] Error resolving warehouse:', error);
    }
    return ERP_CONFIG.DEFAULT_WAREHOUSE;
}

/**
 * Retorna el nombre de la tabla de stock para un almacén dado
 */
export function getStockTableName(warehouse) {
    const formatted = (warehouse || ERP_CONFIG.DEFAULT_WAREHOUSE).padStart(2, '0');
    return `prd01${formatted}`;
}

/**
 * Retorna el nombre de la columna de stock en prd0101 para un almacén dado
 */
export function getStockColumnName(warehouse) {
    const formatted = (warehouse || ERP_CONFIG.DEFAULT_WAREHOUSE).padStart(2, '0');
    return `stk${formatted}`;
}

/**
 * Calcula el desglose de IGV para un monto total
 */
export function calculateTaxBreakdown(total, isTaxed = true) {
    if (!isTaxed) {
        return {
            total: Number(total),
            subtotal: Number(total),
            tax: 0
        };
    }
    const subtotal = total / ERP_CONFIG.TAX_RATE;
    return {
        total: Number(total),
        subtotal: Number(subtotal),
        tax: Number(total - subtotal)
    };
}
