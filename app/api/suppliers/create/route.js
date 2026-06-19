import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.company) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { nompro, rucpro, dirpro, telpro, email } = body;

        if (!nompro) {
            return NextResponse.json({ error: 'Razón Social / Nombre es requerido' }, { status: 400 });
        }
        if (!rucpro) {
            return NextResponse.json({ error: 'RUC / Documento es requerido' }, { status: 400 });
        }

        const pool = await getConnection(session.user.company);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Obtener el código máximo para autogenerar el siguiente correlativo
            const maxCodRes = await transaction.request().query(`
                SELECT MAX(codpro) as maxCod 
                FROM mst01pro WITH(nolock)
                WHERE codpro LIKE 'P%' AND codpro <> 'P00000'
            `);
            
            const maxCod = maxCodRes.recordset[0]?.maxCod;
            let nextCode = 'P00001';

            if (maxCod) {
                const cleanMax = maxCod.trim();
                const num = parseInt(cleanMax.substring(1), 10);
                if (!isNaN(num)) {
                    nextCode = 'P' + (num + 1).toString().padStart(5, '0');
                }
            }

            // 2. Insertar en mst01pro
            const reqInsert = transaction.request();
            reqInsert.input('codpro', sql.Char(6), nextCode);
            reqInsert.input('nompro', sql.Char(60), nompro.trim().toUpperCase().substring(0, 60));
            reqInsert.input('rucpro', sql.Char(11), rucpro.trim().substring(0, 11));
            reqInsert.input('dirpro', sql.VarChar(60), (dirpro || '').trim().toUpperCase().substring(0, 60));
            reqInsert.input('telpro', sql.VarChar(25), (telpro || '').trim().substring(0, 25));
            reqInsert.input('email', sql.VarChar(60), (email || '').trim().substring(0, 60));
            reqInsert.input('estado', sql.Int, 1);

            await reqInsert.query(`
                INSERT INTO mst01pro (codpro, nompro, rucpro, dirpro, telpro, email, estado, FecReg)
                VALUES (@codpro, @nompro, @rucpro, @dirpro, @telpro, @email, @estado, GETDATE())
            `);

            await transaction.commit();
            return NextResponse.json({ success: true, codpro: nextCode });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('[API Suppliers Create] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
