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

        const { nomcli, ruccli, phone, birthdate, address, docType } = await req.json();
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

        // 3. Obtener defaults dinámicos (Evitar FK errors en empresas que no tienen V0001)
        const defaultsRes = await pool.request().query(`
            SELECT 
                (SELECT TOP 1 codven FROM tbl01ven WHERE estado = 1) as defVen,
                (SELECT TOP 1 codcdv FROM tbl01cdv) as defCdv
        `);
        const erpDefVen = defaultsRes.recordset[0]?.defVen || 'V0001';
        const erpDefCdv = defaultsRes.recordset[0]?.defCdv || '01';

        // 4. Registrar en Navasoft
        let finalCodDocIde = '01'; // Default DNI
        if (docType === 'CE' || docType === '04') {
            finalCodDocIde = '04';
        } else if (docType === 'RUC' || docType === '06') {
            finalCodDocIde = '06';
        } else if (docType === 'DNI' || docType === '01') {
            finalCodDocIde = '01';
        } else {
            // Fallback por longitud
            finalCodDocIde = ruccli.length === 11 ? '06' : '01';
        }

        await pool.request()
            .input('codcli', sql.Char(6), finalCodCli)
            .input('nomcli', sql.VarChar(60), (nomcli || 'NUEVO CLIENTE').substring(0, 60))
            .input('ruccli', sql.Char(11), ruccli.substring(0, 11))
            .input('tipodoc', sql.Char(2), finalCodDocIde)
            .input('phone', sql.VarChar(15), (phone || '').substring(0, 15))
            .input('birthdate', sql.DateTime, birthdate ? new Date(birthdate) : null)
            .input('address', sql.VarChar(80), (address || '').substring(0, 80))
            .input('codven', sql.Char(5), erpDefVen)
            .input('codcdv', sql.Char(2), erpDefCdv)
            .query(`
                INSERT INTO mst01cli (
                    codcli, nomcli, ruccli, tipocl, codpai, coddocide, codcdv, 
                    estado, fecing, fecreg, codven, celcli, fecnac, dircli
                )
                VALUES (
                    @codcli, @nomcli, @ruccli, 'B ', '01', @tipodoc, @codcdv, 
                    1, GETDATE(), GETDATE(), @codven, @phone, @birthdate, @address
                )
            `);

        // 5. También registrar en la tabla interna de Railway (como respaldo)
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
