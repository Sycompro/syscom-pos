const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function getActiveCaja() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- BUSCANDO CAJA ABIERTA ---");
        const res = await sql.query("SELECT TOP 1 idapecaj FROM dtl_restpos_apecaj WHERE estado = 'A' ORDER BY fecha DESC");
        console.log(res.recordset[0]);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
getActiveCaja();
