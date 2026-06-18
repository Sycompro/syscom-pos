import { getConnection } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import sql from 'mssql';

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const company = session.user.company;
    const body = await request.json();
    
    const { codi, descr, marc, umed, pvns, codf, estado } = body;

    if (!codi) {
      return NextResponse.json({ error: 'El código de producto (codi) es requerido' }, { status: 400 });
    }

    const pool = await getConnection(company);

    // 1. Iniciar una transacción para asegurar la consistencia total de la actualización
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 2. Actualizar la tabla maestra prd0101
      const updateMaster = transaction.request();
      updateMaster.input('codi', sql.VarChar(20), codi);
      updateMaster.input('descr', sql.VarChar(100), descr || '');
      updateMaster.input('marc', sql.VarChar(30), marc || '');
      updateMaster.input('umed', sql.VarChar(10), umed || 'UND');
      updateMaster.input('pvns', sql.Decimal(14, 4), parseFloat(pvns) || 0);
      updateMaster.input('codf', sql.VarChar(30), codf || '');
      updateMaster.input('estado', sql.Int, parseInt(estado) === 0 ? 0 : 1);

      await updateMaster.query(`
        UPDATE prd0101 
        SET descr = @descr, 
            marc = @marc, 
            umed = @umed, 
            pvns = @pvns, 
            codf = @codf, 
            estado = @estado 
        WHERE LTRIM(RTRIM(codi)) = LTRIM(RTRIM(@codi))
      `);

      // 3. Buscar dinámicamente qué tablas secundarias prd01XX existen en la BD
      const tablesRes = await transaction.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME LIKE 'prd01[0-9][0-9]' 
          AND TABLE_NAME <> 'prd0101'
      `);

      const secondaryTables = tablesRes.recordset.map(t => t.TABLE_NAME);

      // 4. Propagar metadatos a cada tabla secundaria para mantener la consistencia del ERP físico
      for (const table of secondaryTables) {
        const updateSec = transaction.request();
        updateSec.input('codi', sql.VarChar(20), codi);
        updateSec.input('descr', sql.VarChar(100), descr || '');
        updateSec.input('marc', sql.VarChar(30), marc || '');
        updateSec.input('umed', sql.VarChar(10), umed || 'UND');
        updateSec.input('codf', sql.VarChar(30), codf || '');
        updateSec.input('estado', sql.Int, parseInt(estado) === 0 ? 0 : 1);

        await updateSec.query(`
          UPDATE ${table} 
          SET descr = @descr, 
              marc = @marc, 
              umed = @umed, 
              codf = @codf, 
              estado = @estado 
          WHERE LTRIM(RTRIM(codi)) = LTRIM(RTRIM(@codi))
        `);
      }

      // 5. Confirmar transacción
      await transaction.commit();
      console.log(`[API Products Update] Producto ${codi} actualizado en prd0101 y propagado a: ${secondaryTables.join(', ')}`);

      return NextResponse.json({ 
        success: true, 
        message: 'Producto actualizado con éxito',
        propagatedTables: secondaryTables
      });

    } catch (err) {
      // Revertir ante cualquier fallo
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error('[API Products Update] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
