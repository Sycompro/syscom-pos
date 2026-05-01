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

async function getProcText() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("EXEC sp_helptext 'Stock_Consolidado'");
        console.log("Source code for Stock_Consolidado:");
        result.recordset.forEach(row => process.stdout.write(row.Text));
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

getProcText();
