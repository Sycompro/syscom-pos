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

async function checkItems() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT TOP 20 codi, nomdet FROM tbl01itm WHERE codi <> '0000-000000'");
        console.log("Items in tbl01itm:");
        result.recordset.forEach(row => console.log(`${row.codi} | ${row.nomdet}`));
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

checkItems();
