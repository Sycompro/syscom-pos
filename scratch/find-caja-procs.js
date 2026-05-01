const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function findCajaProcs() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- PROCEDIMIENTOS DE CAJA ---");
        const res = await sql.query("SELECT name FROM sys.procedures WHERE name LIKE '%cierra%' OR name LIKE '%caja%' ORDER BY name");
        console.table(res.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
findCajaProcs();
