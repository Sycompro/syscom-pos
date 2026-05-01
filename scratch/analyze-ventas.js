const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function analyzeVentas() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- BUSCANDO PROCESOS DE VENTA ---");
        const query = `
            SELECT name, type_desc 
            FROM sys.objects 
            WHERE type IN ('P', 'V', 'IF', 'TF') 
              AND (name LIKE '%Guardar%' OR name LIKE '%Venta%' OR name LIKE '%Facturar%' OR name LIKE '%Generar%')
            ORDER BY name
        `;
        const res = await sql.query(query);
        console.table(res.recordset);

        console.log("\n--- BUSCANDO POSIBLE API O WEB SERVICES ---");
        const queryWeb = `
            SELECT name 
            FROM sys.objects 
            WHERE name LIKE '%api%' OR name LIKE '%ws%' OR name LIKE '%web%'
        `;
        const resWeb = await sql.query(queryWeb);
        console.table(resWeb.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
analyzeVentas();
