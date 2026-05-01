const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function findNotaVenta() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- BUSCANDO TABLAS DE NOTA DE VENTA ---");
        const res = await sql.query("SELECT name FROM sys.objects WHERE type = 'U' AND (name LIKE '%Nota%' OR name LIKE '%NV%') ORDER BY name");
        console.table(res.recordset);

        console.log("\n--- BUSCANDO EN mst01fac TIPOS DE DOCUMENTO ---");
        // cdocu es el código de documento en mst01fac
        const resDocs = await sql.query("SELECT DISTINCT cdocu FROM mst01fac");
        console.table(resDocs.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
findNotaVenta();
