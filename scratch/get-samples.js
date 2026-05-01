const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function getSamples() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- EJEMPLOS DE ndocu (FACTURAS) ---");
        const res = await sql.query("SELECT TOP 5 ndocu FROM mst01fac WHERE cdocu = '01'");
        console.table(res.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
getSamples();
