const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function deepAnalysis() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- TRIGGERS EN VENTAS ---");
        const resTrig = await sql.query(`
            SELECT name, OBJECT_NAME(parent_id) as TableName 
            FROM sys.triggers 
            WHERE parent_id IN (OBJECT_ID('mst01fac'), OBJECT_ID('dtl01fac'))
        `);
        console.table(resTrig.recordset);

        console.log("\n--- BÚSQUEDA DE PRODUCTOS (COLUMNAS CLAVE) ---");
        const resPrd = await sql.query("SELECT TOP 1 * FROM prd0101");
        if (resPrd.recordset[0]) {
            console.log(Object.keys(resPrd.recordset[0]));
        }

        console.log("\n--- MÉTODOS DE PAGO (TABLA tbl01tar - Tarjetas) ---");
        const resTar = await sql.query("SELECT codtar, nomtar FROM tbl01tar");
        console.table(resTar.recordset);

        console.log("\n--- CONFIGURACIÓN DE POS (tbl_restpos_parametros) ---");
        const resParam = await sql.query("SELECT * FROM tbl_restpos_parametros");
        console.table(resParam.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
deepAnalysis();
