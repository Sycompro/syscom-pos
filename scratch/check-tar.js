const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function checkTar() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- MÉTODOS DE PAGO (tbl01tar) ---");
        const res = await sql.query("SELECT * FROM tbl01tar");
        console.table(res.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
checkTar();
