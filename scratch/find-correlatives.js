const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function findCorrelatives() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- TABLAS DE NUMERACIÓN / CORRELATIVOS ---");
        const res = await sql.query("SELECT name FROM sys.objects WHERE type = 'U' AND (name LIKE '%num%' OR name LIKE '%cor%' OR name LIKE '%nro%' OR name LIKE '%serie%') ORDER BY name");
        console.table(res.recordset);

        console.log("\n--- REVISANDO tbl01num (SI EXISTE) ---");
        try {
            const resNum = await sql.query("SELECT TOP 10 * FROM tbl01num");
            console.table(resNum.recordset);
        } catch (e) {
            console.log("tbl01num no existe o error.");
        }

        console.log("\n--- REVISANDO tbl01nro (SI EXISTE) ---");
        try {
            const resNro = await sql.query("SELECT TOP 10 * FROM tbl01nro");
            console.table(resNro.recordset);
        } catch (e) {
            console.log("tbl01nro no existe o error.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
findCorrelatives();
