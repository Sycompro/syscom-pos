const sql = require('mssql');
require('dotenv').config();

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

async function findProcs() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT name FROM sys.procedures WHERE name LIKE '%stock%' OR name LIKE '%saldo%' OR name LIKE '%articulo%' OR name LIKE '%item%'");
        console.log("Procedures related to stock/items:");
        result.recordset.forEach(row => console.log(row.name));
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

findProcs();
