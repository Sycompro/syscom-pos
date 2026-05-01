const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function findPadronTables() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- BUSCANDO TABLAS DE PADRÓN/SUNAT/DNI ---");
        const res = await sql.query("SELECT name FROM sys.tables WHERE name LIKE '%padron%' OR name LIKE '%sunat%' OR name LIKE '%ruc%' OR name LIKE '%dni%' ORDER BY name");
        console.table(res.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
findPadronTables();
