const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function checkSchema() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- COLUMNAS DE mst01ped ---");
        const resPed = await sql.query("SELECT TOP 1 * FROM mst01ped");
        console.log(Object.keys(resPed.recordset[0]));

        console.log("\n--- COLUMNAS DE dtl_restpos_apecaj ---");
        const resApe = await sql.query("SELECT TOP 1 * FROM dtl_restpos_apecaj");
        console.log(Object.keys(resApe.recordset[0]));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
checkSchema();
