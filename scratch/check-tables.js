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

async function checkTables() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT name FROM sys.tables ORDER BY name");
        console.log("Tables in " + process.env.DB_NAME + ":");
        result.recordset.forEach(row => console.log(row.name));
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

checkTables();
