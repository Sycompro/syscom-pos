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

async function checkWebItems() {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT COUNT(*) as count FROM prd0101 WHERE verweb=1");
        console.log("Items with verweb=1 in prd0101: " + result.recordset[0].count);
        
        let sample = await pool.request().query("SELECT TOP 5 codf, descr, pvns FROM prd0101 WHERE verweb=1");
        console.log("Sample web items:");
        console.log(sample.recordset);
        
        await sql.close();
    } catch (err) {
        console.error(err);
    }
}

checkWebItems();
