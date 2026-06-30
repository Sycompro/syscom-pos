import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getConnection } from "@/lib/db";
import logger from "@/lib/logger";
import sql from 'mssql';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const idApeCaj = searchParams.get('idApeCaj');
        let codpto = searchParams.get('codpto') || '01';

        const pool = await getConnection(session.user.company);

        if (idApeCaj && idApeCaj !== 'undefined' && idApeCaj !== 'null') {
            const activeCashRes = await pool.request()
                .input('idapecaj', sql.Int, parseInt(idApeCaj, 10))
                .query('SELECT codpto FROM dtl_restpos_apecaj WHERE LTRIM(RTRIM(idapecaj)) = LTRIM(RTRIM(@idapecaj))');
            if (activeCashRes.recordset.length > 0) {
                codpto = activeCashRes.recordset[0].codpto.trim();
            }
        }
        
        // Obtener condiciones de pago de tbl01cdc (Condiciones de Compra)
        const condResult = await pool.request().query(`
            SELECT LTRIM(RTRIM(codcdc)) as codcdv, LTRIM(RTRIM(nomcdc)) as nomcdv 
            FROM tbl01cdc WITH(nolock) 
            ORDER BY codcdc
        `);

        // Obtener clasificaciones de OCM de tbl01Coc
        const cocResult = await pool.request().query(`
            SELECT LTRIM(RTRIM(codcoc)) as codcoc, LTRIM(RTRIM(Nomcoc)) as nomcoc 
            FROM tbl01Coc WITH(nolock) 
            ORDER BY codcoc
        `);

        // Obtener almacenes de tbl01alm
        const almResult = await pool.request().query(`
            SELECT LTRIM(RTRIM(codalm)) as codalm, LTRIM(RTRIM(nomalm)) as nomalm 
            FROM tbl01alm WITH(nolock) 
            ORDER BY codalm
        `);

        // Obtener transportistas de tbl01tra
        const traResult = await pool.request().query(`
            SELECT LTRIM(RTRIM(codtra)) as codtra, LTRIM(RTRIM(nomtra)) as nomtra 
            FROM tbl01tra WITH(nolock) 
            ORDER BY codtra
        `);

        // Obtener sub-centros de costo de tbl01scc
        const sccResult = await pool.request().query(`
            SELECT LTRIM(RTRIM(codscc)) as codscc, LTRIM(RTRIM(nomscc)) as nomscc 
            FROM tbl01scc WITH(nolock) 
            ORDER BY codscc
        `);

        // Obtener tipo de cambio de hoy o el último registrado
        const tcResult = await pool.request().query(`
            SELECT TOP 1 CAST(tcvta as float) as tcvta, CAST(tccom as float) as tccom 
            FROM tbl01tca WITH(nolock) 
            WHERE tcvta > 0 AND fecha <= GETDATE() 
            ORDER BY fecha DESC
        `);

        // Obtener el correlativo actual de OCM (cdocu = '28') para el punto de venta
        const corResult = await pool.request()
            .input('cdocu', '28')
            .input('codpto', codpto)
            .query(`
                SELECT LTRIM(RTRIM(nroini)) as nroini 
                FROM tbl01cor WITH(nolock) 
                WHERE cdocu = @cdocu AND codpto = @codpto
            `);

        let nextNdocu = '';
        if (corResult.recordset.length > 0) {
            const currentNroIni = corResult.recordset[0].nroini;
            const parts = currentNroIni.split('-');
            const series = parts[0];
            const numPartClean = (parts[1] || parts[0]).replace(/[^0-9]/g, '');
            const nextNum = (parseInt(numPartClean, 10) + 1).toString().padStart(numPartClean.length, '0');
            nextNdocu = `${series}-${nextNum}`;
        }

        const exchangeRate = tcResult.recordset.length > 0 ? tcResult.recordset[0] : { tcvta: 3.40, tccom: 3.39 };

        return NextResponse.json({
            success: true,
            conditions: condResult.recordset,
            classifications: cocResult.recordset,
            warehouses: almResult.recordset,
            transportists: traResult.recordset,
            subCentersOfCost: sccResult.recordset,
            exchangeRate: exchangeRate,
            nextNdocu: nextNdocu
        });

    } catch (err) {
        logger.error(`[API/Purchases/Ocm/Metadata] Error al obtener metadata de OCM: ${err.message}`);
        return NextResponse.json({ 
            error: 'Error al obtener condiciones, clasificaciones, almacenes, transportistas y tipo de cambio', 
            details: err.message 
        }, { status: 500 });
    }
}
