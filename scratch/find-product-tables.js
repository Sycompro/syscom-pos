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

async function findTables() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT name FROM sys.tables WHERE name LIKE '%art%' OR name LIKE '%pro%' OR name LIKE '%itm%'");
        console.log("Potential product/item tables:");
        result.recordset.forEach(row => console.log(row.name));
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

findTables();
