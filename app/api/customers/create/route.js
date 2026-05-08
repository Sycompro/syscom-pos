import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { nomcli, ruccli, celcli, email, direccion } = body;

        if (!nomcli) return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 });

        const pool = await getConnection(session.user.company);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Obtener y actualizar contador psn0100
            const psnRes = await transaction.request().query("SELECT codcli FROM psn0100");
            let lastCode = psnRes.recordset[0].codcli.trim(); // Ej: 'C00293'
            
            // Lógica de incremento Navasoft: C + 5 dígitos padding
            let prefix = lastCode.substring(0, 1);
            let num = parseInt(lastCode.substring(1)) + 1;
            let nextCode = prefix + num.toString().padStart(5, '0');

            await transaction.request()
                .input('nextCode', sql.Char(6), nextCode)
                .query("UPDATE psn0100 SET codcli = @nextCode");

            // 2. Insertar nuevo cliente en mst01cli
            const isRuc = (ruccli || '').trim().length === 11;
            const tipdoc = isRuc ? '6' : '1';

            await transaction.request()
                .input('codcli', sql.Char(6), nextCode)
                .input('nomcli', sql.Char(60), nomcli.substring(0, 60).toUpperCase())
                .input('ruccli', sql.Char(11), (ruccli || '').substring(0, 11))
                .input('nrodni', sql.Char(8), isRuc ? '' : (ruccli || '').substring(0, 8))
                .input('telcli', sql.VarChar(40), (celcli || '').substring(0, 40))
                .input('email', sql.VarChar(60), (email || '').substring(0, 60))
                .input('dircli', sql.Char(80), (direccion || '').substring(0, 80).toUpperCase())
                .input('tipdoc', sql.Char(1), tipdoc)
                .input('codven', sql.Char(5), 'V0318') // Default de producción psn0100
                .input('codcdv', sql.Char(2), '01') 
                .input('estado', sql.Bit, 1)
                .query(`
                    INSERT INTO mst01cli (codcli, nomcli, ruccli, nrodni, telcli, email, dircli, tipdoc, codven, codcdv, estado, fecing, fecreg)
                    VALUES (@codcli, @nomcli, @ruccli, @nrodni, @telcli, @email, @dircli, @tipdoc, @codven, @codcdv, @estado, GETDATE(), GETDATE())
                `);

            await transaction.commit();
            return NextResponse.json({ success: true, codcli: nextCode });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Error in customer creation:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
