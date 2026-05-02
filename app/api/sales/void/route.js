import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const body = await request.json();
    const { cdocu, ndocu } = body;

    if (!cdocu || !ndocu) {
        return NextResponse.json({ error: 'Faltan datos del documento' }, { status: 400 });
    }

    const pool = await getConnection(session.user.company);
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Verificar existencia y estado actual
        const checkRes = await transaction.request()
            .input('cdocu', sql.Char(2), cdocu)
            .input('ndocu', sql.Char(12), ndocu)
            .query("SELECT flag, CodAlm FROM mst01fac WHERE cdocu = @cdocu AND ndocu = @ndocu");

        if (checkRes.recordset.length === 0) {
            throw new Error('Documento no encontrado');
        }

        if (checkRes.recordset[0].flag === '*') {
            throw new Error('El documento ya está anulado');
        }

        const warehouse = checkRes.recordset[0].CodAlm.trim();
        const stockField = `stk${warehouse.padStart(2, '0')}`;

        // 2. Anular Cabecera y Detalle (Estándar Navasoft: flag '*')
        await transaction.request()
            .input('cdocu', sql.Char(2), cdocu)
            .input('ndocu', sql.Char(12), ndocu)
            .query("UPDATE mst01fac SET flag = '*' WHERE cdocu = @cdocu AND ndocu = @ndocu");

        await transaction.request()
            .input('cdocu', sql.Char(2), cdocu)
            .input('ndocu', sql.Char(12), ndocu)
            .query("UPDATE dtl01fac SET flag = '*' WHERE cdocu = @cdocu AND ndocu = @ndocu");

        // 3. Devolver Stock (DOBLE IMPACTO: Almacén + Consolidado)
        const itemsRes = await transaction.request()
            .input('cdocu', sql.Char(2), cdocu)
            .input('ndocu', sql.Char(12), ndocu)
            .query("SELECT codi, cant FROM dtl01fac WHERE cdocu = @cdocu AND ndocu = @ndocu");

        for (const item of itemsRes.recordset) {
            await transaction.request()
                .input('codi', sql.Char(15), item.codi)
                .input('cant', sql.Float, item.cant)
                .query(`
                    UPDATE prd0101 
                    SET ${stockField} = ${stockField} + @cant,
                        stoc = stoc + @cant 
                    WHERE codi = @codi
                `);
        }

        await transaction.commit();

        return NextResponse.json({ success: true, message: 'Documento anulado correctamente' });

    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error('Void error:', err);
        return NextResponse.json({ error: 'Error al anular', details: err.message }, { status: 500 });
    }
}
