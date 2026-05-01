const sql = require('mssql');
require('dotenv').config({ path: 'c:/Users/Administrador/Desktop/dato.click/pagina-web/.env' });

async function findWebParams() {
    try {
        await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_NAME,
            options: { encrypt: false, trustServerCertificate: true }
        });
        
        console.log("--- BUSCANDO PARÁMETROS DE URL/IP (IDPARA) ---");
        const query = `
            SELECT * FROM tbl_parametro_web 
            WHERE IDPARA LIKE '%IP%' 
               OR IDPARA LIKE '%Url%' 
               OR IDPARA LIKE '%Link%' 
               OR IDPARA LIKE '%Host%'
        `;
        const res = await sql.query(query);
        console.table(res.recordset);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
findWebParams();
