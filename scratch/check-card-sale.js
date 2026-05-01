const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function checkCardSale() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- VENTA CON TARJETA (mst01fac) ---");
        const res = await sql.query("SELECT TOP 1 * FROM mst01fac WHERE selpago = 3");
        console.log(res.recordset[0]);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
checkCardSale();
