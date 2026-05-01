const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function getGrabaFacDef() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- DEFINICIÓN DE GrabaMstFacFac ---");
        const res = await sql.query("SELECT definition FROM sys.sql_modules WHERE object_id = OBJECT_ID('GrabaMstFacFac')");
        if (res.recordset[0]) {
            console.log(res.recordset[0].definition);
        } else {
            console.log("No se encontró el procedimiento.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
getGrabaFacDef();
