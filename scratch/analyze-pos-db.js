const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function analyzePOS() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- PROCEDIMIENTOS DE POS / VENTAS / CAJA ---");
        const resProcs = await sql.query(`
            SELECT name FROM sys.objects 
            WHERE type = 'P' 
              AND (name LIKE '%Caja%' 
               OR name LIKE '%Venta%' 
               OR name LIKE '%Apertura%' 
               OR name LIKE '%Cierre%' 
               OR name LIKE '%POS%'
               OR name LIKE '%Ticket%')
            ORDER BY name
        `);
        console.table(resProcs.recordset);

        console.log("\n--- TABLAS DE POS / VENTAS / CAJA ---");
        const resTables = await sql.query(`
            SELECT name FROM sys.objects 
            WHERE type = 'U' 
              AND (name LIKE '%Caja%' 
               OR name LIKE '%Venta%' 
               OR name LIKE '%Apertura%' 
               OR name LIKE '%Cierre%' 
               OR name LIKE '%POS%'
               OR name LIKE '%Ticket%')
            ORDER BY name
        `);
        console.table(resTables.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
analyzePOS();
