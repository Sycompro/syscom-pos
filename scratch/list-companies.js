const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function listCompanies() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: 'BdNavaSys',
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- EMPRESAS REGISTRADAS ---");
        const res = await sql.query("SELECT * FROM sysnavacia");
        console.table(res.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
listCompanies();
