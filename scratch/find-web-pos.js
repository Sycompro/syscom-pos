const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function findWebPOS() {
    try {
        const config = {
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        
        await sql.connect(config);
        console.log("--- BUSCANDO OBJETOS RELACIONADOS CON WEB/POS ---");
        
        const query = `
            SELECT name, type_desc 
            FROM sys.objects 
            WHERE name LIKE '%web%' 
               OR name LIKE '%api%' 
               OR name LIKE '%pos%' 
            ORDER BY type_desc, name
        `;
        
        const res = await sql.query(query);
        console.table(res.recordset);
        
        console.log("\n--- BUSCANDO COLUMNAS RELACIONADAS ---");
        const queryCols = `
            SELECT t.name AS TableName, c.name AS ColumnName
            FROM sys.columns c
            JOIN sys.tables t ON c.object_id = t.object_id
            WHERE c.name LIKE '%web%' OR c.name LIKE '%pos%'
        `;
        const resCols = await sql.query(queryCols);
        console.table(resCols.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

findWebPOS();
