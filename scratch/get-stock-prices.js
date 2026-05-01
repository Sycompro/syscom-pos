const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function getStockPrices() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- PRODUCTOS, PRECIOS Y STOCK ---");
        // Nota: El stock suele estar en una tabla separada por almacén si prd0101 no tiene datos.
        // Pero primero chequeamos prd0101
        const res = await sql.query("SELECT TOP 10 codart, desart, prevta1, prevta2, prevta3 FROM prd0101");
        console.table(res.recordset);

        console.log("\n--- BUSCANDO TABLA DE STOCK (tbl01inv o similar) ---");
        const resInv = await sql.query("SELECT TOP 5 * FROM tbl01inv");
        console.table(resInv.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
getStockPrices();
