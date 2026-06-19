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
    
    const { 
      codi, descr, codmar, umed = 'UND', pvns = 0, cost = 0,
      codcolor_prod = '   ', talla = '          ', codf = '',
      tipoitm = 1, msto = 'S', aigv = 'S', membershipDays = 0, estado = 1
    } = body;

    if (!codi) {
      return NextResponse.json({ error: 'El código de producto (codi) es requerido' }, { status: 400 });
    }

    const priceVal = parseFloat(pvns);
    const costVal = parseFloat(cost) || 0;
    
    if (isNaN(priceVal) || priceVal < 0) {
      return NextResponse.json({ error: 'El precio de venta (pvns) debe ser un número válido mayor o igual a cero' }, { status: 400 });
    }

    if (isNaN(costVal) || costVal < 0) {
      return NextResponse.json({ error: 'El costo de compra (cost) debe ser un número válido mayor o igual a cero' }, { status: 400 });
    }

    const pool = await getConnection(company);

    // 1. Obtener Nombre de la Marca desde tbl01mar usando el codmar
    const brandRes = await pool.request()
      .input('codmar', sql.Char(4), codmar || '0000')
      .query('SELECT TOP 1 LTRIM(RTRIM(Nommar)) as name FROM tbl01mar WITH(nolock) WHERE codmar = @codmar');
    
    const brandName = brandRes.recordset[0]?.name || 'ND';

    // 2. Iniciar una transacción
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 3. Calcular precios, IGV y utilidades
      const vvns = aigv === 'N' ? priceVal : priceVal / 1.18;
      const igvns = aigv === 'N' ? 0.0000 : priceVal - vvns;
      const funs = vvns - costVal;

      const cleanDescr = descr.trim().toUpperCase();
      const cleanCodf = (codf || '').trim().toUpperCase();

      // 4. Actualizar la tabla maestra prd0101
      const updateMaster = transaction.request();
      updateMaster.input('codi', sql.Char(20), codi);
      updateMaster.input('descr', sql.VarChar(100), cleanDescr.padEnd(100, ' '));
      updateMaster.input('marc', sql.VarChar(30), brandName.substring(0, 30).padEnd(30, ' '));
      updateMaster.input('codmar', sql.Char(4), codmar || '0000');
      updateMaster.input('umed', sql.Char(3), umed.substring(0, 3).padEnd(3, ' '));
      updateMaster.input('pvns', sql.Decimal(14, 4), priceVal);
      updateMaster.input('vvns', sql.Decimal(14, 4), vvns);
      updateMaster.input('igvns', sql.Decimal(14, 4), igvns);
      updateMaster.input('codcolor_prod', sql.Char(3), (codcolor_prod || '   ').padEnd(3, ' '));
      updateMaster.input('talla', sql.Char(10), (talla || '').padEnd(10, ' '));
      updateMaster.input('codf', sql.Char(20), cleanCodf.padEnd(20, ' '));
      updateMaster.input('tipoitm', sql.Int, tipoitm);
      updateMaster.input('msto', sql.Char(1), msto);
      updateMaster.input('aigv', sql.Char(1), aigv);
      updateMaster.input('estado', sql.Int, parseInt(estado) === 0 ? 0 : 1);
      updateMaster.input('Usr_003', sql.VarChar(30), (membershipDays > 0 ? membershipDays.toString() : '').padEnd(30, ' '));
      
      updateMaster.input('pcns', sql.Decimal(14, 4), costVal);
      updateMaster.input('pcus', sql.Decimal(14, 4), costVal / 3.75);
      updateMaster.input('funs', sql.Decimal(14, 4), funs);

      await updateMaster.query(`
        UPDATE prd0101 
        SET descr = @descr, 
            marc = @marc, 
            codmar = @codmar,
            umed = @umed, 
            pvns = @pvns, 
            vvns = @vvns,
            igvns = @igvns,
            codcolor_prod = @codcolor_prod,
            talla = @talla,
            codf = @codf, 
            tipoitm = @tipoitm,
            msto = @msto,
            aigv = @aigv,
            estado = @estado,
            pcns = @pcns,
            pcus = @pcus,
            pans = @pcns,
            paus = @pcus,
            funs = @funs,
            Usr_003 = @Usr_003
        WHERE LTRIM(RTRIM(codi)) = LTRIM(RTRIM(@codi))
      `);

      // 5. Buscar dinámicamente qué tablas secundarias prd01XX existen en la BD
      const tablesRes = await transaction.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME LIKE 'prd01[0-9][0-9]' 
          AND TABLE_NAME <> 'prd0101'
      `);
      const secondaryTables = tablesRes.recordset.map(t => t.TABLE_NAME);

      // 6. Propagar metadatos a cada tabla secundaria
      for (const table of secondaryTables) {
        const updateSec = transaction.request();
        updateSec.input('codi', sql.Char(20), codi);
        updateSec.input('descr', sql.VarChar(100), cleanDescr.padEnd(100, ' '));
        updateSec.input('marc', sql.VarChar(30), brandName.substring(0, 30).padEnd(30, ' '));
        updateSec.input('umed', sql.Char(3), umed.substring(0, 3).padEnd(3, ' '));
        updateSec.input('pvns', sql.Decimal(14, 4), priceVal);
        updateSec.input('vvns', sql.Decimal(14, 4), vvns);
        updateSec.input('igvns', sql.Decimal(14, 4), igvns);
        updateSec.input('codf', sql.Char(20), cleanCodf.padEnd(20, ' '));
        updateSec.input('estado', sql.Int, parseInt(estado) === 0 ? 0 : 1);
        updateSec.input('msto', sql.Char(1), msto);
        updateSec.input('aigv', sql.Char(1), aigv);
        updateSec.input('tipoitm', sql.Int, tipoitm);
        updateSec.input('Usr_003', sql.VarChar(30), (membershipDays > 0 ? membershipDays.toString() : '').padEnd(30, ' '));
        
        updateSec.input('pcns', sql.Decimal(14, 4), costVal);
        updateSec.input('pcus', sql.Decimal(14, 4), costVal / 3.75);
        updateSec.input('funs', sql.Decimal(14, 4), funs);

        await updateSec.query(`
          UPDATE ${table} 
          SET descr = @descr, 
              marc = @marc, 
              umed = @umed, 
              pvns = @pvns, 
              vvns = @vvns,
              igvns = @igvns,
              codf = @codf, 
              estado = @estado,
              msto = @msto,
              aigv = @aigv,
              tipoitm = @tipoitm,
              pcns = @pcns,
              pcus = @pcus,
              pans = @pcns,
              paus = @pcus,
              funs = @funs,
              Usr_003 = @Usr_003
          WHERE LTRIM(RTRIM(codi)) = LTRIM(RTRIM(@codi))
        `);
      }

      // 7. Sincronizar los nuevos precios en todas las listas de precios de Dtl01Pre
      // 7a. Primero, ver en qué listas de precios ya está registrado este artículo para hacer UPDATE
      const existingPreRes = await transaction.request()
        .input('codi', sql.Char(20), codi)
        .query(`SELECT DISTINCT LTRIM(RTRIM(CodLis)) as CodLis FROM Dtl01Pre WITH(nolock) WHERE Codi = @codi`);
      const existingPriceLists = existingPreRes.recordset.map(r => r.CodLis);

      // 7b. Obtener la lista total de listas de precios del ERP
      const allPriceListsRes = await transaction.request().query(`SELECT LTRIM(RTRIM(CodLis)) as CodLis FROM Tbl_Lista_Precio WITH(nolock)`);
      const allPriceLists = allPriceListsRes.recordset.map(r => r.CodLis);

      // 7c. Para las listas de precios existentes, hacer UPDATE. Para las faltantes, hacer INSERT (evita registros huérfanos)
      for (const codLis of allPriceLists) {
        const queryParams = transaction.request();
        queryParams.input('CodLis', sql.Char(2), codLis);
        queryParams.input('Codi', sql.Char(20), codi);
        queryParams.input('vvns', sql.Decimal(14, 4), vvns);
        queryParams.input('pvns', sql.Decimal(14, 4), priceVal);

        if (existingPriceLists.includes(codLis)) {
          // Existe: actualizar
          await queryParams.query(`
            UPDATE Dtl01Pre 
            SET vvns = @vvns, 
                pvns = @pvns
            WHERE CodLis = @CodLis AND LTRIM(RTRIM(Codi)) = LTRIM(RTRIM(@Codi))
          `);
        } else {
          // No existe: registrar
          await queryParams.query(`
            INSERT INTO Dtl01Pre (
              CodLis, Codi, vvns, pvns, vvus, pvus, RangoIni, RangoFin, 
              dsct, funs, fuus, codcat, fals, Dscto, vvnsE, pvnsE, vvusE, pvusE, nroreg
            ) VALUES (
              @CodLis, @Codi, @vvns, @pvns, 0.0000, 0.0000, 0, 0, 
              0.0000, 0.0000, 0.0000, '01', 0, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0
            )
          `);
        }
      }

      await transaction.commit();
      console.log(`[API Products Update] Producto ${codi} actualizado. Propagado a ${secondaryTables.length} sedes y sincronizado en ${allPriceLists.length} listas de precios.`);

      return NextResponse.json({ 
        success: true, 
        message: 'Producto actualizado con éxito',
        propagatedTables: secondaryTables,
        priceListsCount: allPriceLists.length
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
