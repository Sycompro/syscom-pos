const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function listMstTables() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- TABLAS MAESTRAS (mst01*) ---");
        const res = await sql.query("SELECT name FROM sys.objects WHERE type = 'U' AND name LIKE 'mst01%' ORDER BY name");
        console.table(res.recordset);

        console.log("\n--- REVISANDO SI TIENEN DATOS ---");
        for (let row of res.recordset) {
            const countRes = await sql.query(`SELECT COUNT(*) as total FROM ${row.name}`);
            console.log(`${row.name}: ${countRes.recordset[0].total} registros`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
listMstTables();
