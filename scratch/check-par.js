const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function checkPar() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- CONTENIDO DE tbl01par (PARÁMETROS) ---");
        const res = await sql.query("SELECT * FROM tbl01par");
        console.table(res.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
checkPar();
