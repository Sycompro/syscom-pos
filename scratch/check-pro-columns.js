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

async function checkColumns() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tbl01pro'");
        console.log("Columns in tbl01pro:");
        result.recordset.forEach(row => console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE})`));
        
        console.log("\nSample row from tbl01pro:");
        let sample = await pool.request().query("SELECT TOP 1 * FROM tbl01pro");
        console.log(sample.recordset[0]);

        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

checkColumns();
