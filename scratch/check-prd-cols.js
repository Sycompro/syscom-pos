const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function getPrdCols() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- COLUMNAS DE prd0101 ---");
        const res = await sql.query("SELECT TOP 1 * FROM prd0101");
        console.log(Object.keys(res.recordset[0]));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
getPrdCols();
