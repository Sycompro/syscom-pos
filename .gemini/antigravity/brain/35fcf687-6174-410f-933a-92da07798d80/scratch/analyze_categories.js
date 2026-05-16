const sql = require('mssql');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env') });

async function analyzeCategories() {
    let pool;
    try {
        console.log('--- DIAGNÓSTICO DE CATEGORÍAS Y PRODUCTOS ---');
        
        // Usar la URL de la base de datos Nava01 (Gym)
        pool = await sql.connect(process.env.DB_URL_NAVA01);
        
        console.log('\n1. Muestra de Sub-familias (tbl01sbf):');
        const sbf = await pool.request().query('SELECT TOP 10 codfam, codsub, nomsub FROM tbl01sbf');
        console.table(sbf.recordset);

        console.log('\n2. Muestra de Productos y sus Categorías (prd0101):');
        const prd = await pool.request().query('SELECT TOP 10 codi, codcat, descr FROM prd0101 WHERE estado = 1');
        console.table(prd.recordset);

        console.log('\n3. Verificando inconsistencias (Productos donde el código NO empieza con la familia esperada):');
        // Esta consulta busca productos cuya categoría existe en tbl01sbf pero cuyo código no empieza con el codfam
        const inconsistencies = await pool.request().query(`
            SELECT TOP 10 p.codi, p.codcat, s.codfam, p.descr
            FROM prd0101 p
            INNER JOIN tbl01sbf s ON p.codcat = s.codsub
            WHERE LEFT(p.codi, 2) <> s.codfam
            AND p.estado = 1
        `);
        
        if (inconsistencies.recordset.length > 0) {
            console.log('¡INCONSISTENCIAS ENCONTRADAS! Estos productos no se verían con el filtro actual:');
            console.table(inconsistencies.recordset);
        } else {
            console.log('No se encontraron inconsistencias en la muestra. El patrón parece cumplirse aquí.');
        }

    } catch (err) {
        console.error('Error durante el análisis:', err.message);
    } finally {
        if (pool) await pool.close();
    }
}

analyzeCategories();
