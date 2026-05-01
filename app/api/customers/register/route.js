import { NextResponse } from 'next/server';
import sql from 'mssql';

const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

export async function POST(request) {
    const body = await request.json();
    const { nomcli, ruccli, nrodni, dircli } = body;

    try {
        const pool = await sql.connect(sqlConfig);
        
        // 1. Generar nuevo código de cliente (6 dígitos correlativos)
        // Buscamos el último código numérico
        const lastCli = await pool.request()
            .query("SELECT TOP 1 codcli FROM mst01cli WHERE ISNUMERIC(codcli) = 1 ORDER BY codcli DESC");
        
        let newCode = "000001";
        if (lastCli.recordset.length > 0) {
            const current = parseInt(lastCli.recordset[0].codcli, 10);
            newCode = (current + 1).toString().padStart(6, '0');
        }

        // 2. Insertar usando el SP o directo (usaremos el SP GrabaMstCliWeb hallado antes)
        await pool.request()
            .input('codcli', sql.Char(6), newCode)
            .input('nomcli', sql.VarChar(60), nomcli)
            .input('ruccli', sql.Char(11), ruccli || '')
            .input('nrodni', sql.Char(8), nrodni || '')
            .input('dircli', sql.VarChar(60), dircli || '')
            .input('dirent', sql.VarChar(60), dircli || '')
            .input('codpai', sql.Char(2), 'PE')
            .input('codpos', sql.Char(8), '')
            .input('coddep', sql.Char(2), '')
            .input('codzon', sql.Char(2), '')
            .input('codpro', sql.Char(2), '')
            .input('codact', sql.Char(2), '')
            .input('coddis', sql.Char(3), '')
            .input('codcat', sql.Char(2), '')
            .input('telcli', sql.VarChar(40), body.telcli || '')
            .input('codtipo', sql.Char(2), '')
            .input('faxcli', sql.VarChar(40), '')
            .input('TipFax', sql.Int, 0)
            .input('email', sql.VarChar(100), body.email || '')
            .input('codven', sql.Char(5), 'WEB')
            .execute('GrabaMstCliWeb');

        return NextResponse.json({ success: true, codcli: newCode });

    } catch (err) {
        console.error('Customer registration error:', err);
        return NextResponse.json({ error: 'Error al registrar cliente', details: err.message }, { status: 500 });
    }
}
