import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import logger from '@/lib/logger';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

        const { nomcli, ruccli, phone, birthdate, address } = await req.json();
        const pool = await getConnection(session.user.company);
        
        // 1. Verificar si ya existe por RUC/DNI (Doble check)
        const check = await pool.request()
            .input('ruc', sql.Char(11), ruccli.substring(0, 11))
            .query("SELECT codcli FROM mst01cli WHERE LTRIM(RTRIM(ruccli)) = LTRIM(RTRIM(@ruc)) OR LTRIM(RTRIM(nrodni)) = LTRIM(RTRIM(@ruc))");
        
        if (check.recordset.length > 0) {
            return NextResponse.json({ 
                success: true, 
                codcli: check.recordset[0].codcli.trim(),
                message: 'El cliente ya estaba registrado.' 
            });
        }

        // 2. Calcular siguiente correlativo C0000X
        const resMax = await pool.request().query("SELECT MAX(codcli) as lastCode FROM mst01cli WHERE codcli LIKE 'C%'");
        const lastCode = resMax.recordset[0].lastCode || 'C00000';
        const nextNum = (parseInt(lastCode.replace(/[^0-9]/g, ''), 10) + 1).toString().padStart(5, '0');
        const finalCodCli = `C${nextNum}`;

        // 3. Registrar en Navasoft
        const isRuc = ruccli.length === 11;
        await pool.request()
            .input('codcli', sql.Char(6), finalCodCli)
            .input('nomcli', sql.VarChar(60), (nomcli || 'NUEVO CLIENTE').substring(0, 60))
            .input('ruccli', sql.Char(11), ruccli.substring(0, 11))
            .input('tipodoc', isRuc ? '06' : '01')
            .input('phone', sql.VarChar(15), (phone || '').substring(0, 15))
            .input('birthdate', sql.DateTime, birthdate ? new Date(birthdate) : null)
            .input('address', sql.VarChar(80), (address || '').substring(0, 80))
            .query(`
                INSERT INTO mst01cli (
                    codcli, nomcli, ruccli, tipocl, codpai, coddocide, codcdv, 
                    estado, fecing, fecreg, codven, celcli, fecnac, dircli
                )
                VALUES (
                    @codcli, @nomcli, @ruccli, 'B ', '01', @tipodoc, '01', 
                    1, GETDATE(), GETDATE(), 'V0001', @phone, @birthdate, @address
                )
            `);

        // 4. También registrar en la tabla interna de Railway (como respaldo)
        try {
            await pool.request()
                .input('doc', ruccli)
                .input('name', nomcli)
                .input('phone', phone)
                .input('birthdate', birthdate)
                .query("IF NOT EXISTS (SELECT 1 FROM tbl_clientes_internos WHERE doc = @doc) INSERT INTO tbl_clientes_internos (doc, name, phone, birthdate) VALUES (@doc, @name, @phone, @birthdate)");
        } catch (e) {
            logger.warn('Error al replicar en tabla interna Railway');
        }

        logger.info(`[API/CustomerRegister] Cliente creado exitosamente: ${finalCodCli}`);
        return NextResponse.json({ success: true, codcli: finalCodCli });

    } catch (err) {
        logger.error(`[API/CustomerRegister] Error: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
