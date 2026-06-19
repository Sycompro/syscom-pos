import { getConnection } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import sql from 'mssql';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const company = session.user.company;
    const body = await request.json();
    
    const { 
      descr, codsub, codmar, pvns, codcolor_prod, talla, codf,
      umed = 'UND', tipoitm = 1, msto = 'S', aigv = 'S', membershipDays = 0,
      cost = 0
    } = body;

    // Validar requeridos
    if (!descr || !codsub || !codmar || pvns === undefined) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (descr, codsub, codmar, pvns)' }, { status: 400 });
    }

    const priceVal = parseFloat(pvns);
    if (isNaN(priceVal) || priceVal < 0) {
      return NextResponse.json({ error: 'El precio de venta (pvns) debe ser un número válido mayor o igual a cero' }, { status: 400 });
    }

    const costVal = parseFloat(cost) || 0;
    if (isNaN(costVal) || costVal < 0) {
      return NextResponse.json({ error: 'El costo de compra (cost) debe ser un número válido mayor o igual a cero' }, { status: 400 });
    }

    const pool = await getConnection(company);

    // 1. Obtener Nombre de la Marca desde tbl01mar
    const brandRes = await pool.request()
      .input('codmar', sql.Char(4), codmar)
      .query('SELECT TOP 1 LTRIM(RTRIM(Nommar)) as name FROM tbl01mar WITH(nolock) WHERE codmar = @codmar');
    
    const brandName = brandRes.recordset[0]?.name || 'ND';

    // 2. Iniciar una transacción para la consistencia
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 3. Generar Código Correlativo codi
      const prefix = codsub.replace('-', ''); // Ej: '02-01' -> '0201'
      
      const maxCodiRes = await transaction.request()
        .input('prefixPattern', sql.VarChar(10), `${prefix}-%`)
        .query(`
          SELECT MAX(codi) as maxCodi 
          FROM prd0101 WITH(nolock) 
          WHERE codi LIKE @prefixPattern
        `);
      
      let maxCodi = (maxCodiRes.recordset[0]?.maxCodi || '').trim();
      let generatedCodi = '';

      if (!maxCodi) {
        generatedCodi = `${prefix}-010001`;
      } else {
        const parts = maxCodi.split('-');
        const nextSec = parseInt(parts[1]) + 1;
        generatedCodi = `${prefix}-${nextSec.toString().padStart(6, '0')}`;
      }

      // 4. Calcular precios e IGV (18%)
      const vvns = aigv === 'N' ? priceVal : priceVal / 1.18;
      const igvns = aigv === 'N' ? 0.0000 : priceVal - vvns;

      // Calcular utilidad (funs)
      const funs = vvns - costVal;

      const cleanDescr = descr.trim().toUpperCase();
      const cleanCodf = (codf || '').trim().toUpperCase();

      // 5. Insertar en prd0101
      const insertMaster = transaction.request();
      insertMaster.input('codi', sql.Char(20), generatedCodi);
      insertMaster.input('descr', sql.VarChar(100), cleanDescr.padEnd(100, ' '));
      insertMaster.input('marc', sql.VarChar(30), brandName.substring(0, 30).padEnd(30, ' '));
      insertMaster.input('codmar', sql.Char(4), codmar);
      insertMaster.input('pvns', sql.Decimal(14, 4), priceVal);
      insertMaster.input('vvns', sql.Decimal(14, 4), vvns);
      insertMaster.input('igvns', sql.Decimal(14, 4), igvns);
      insertMaster.input('codcolor_prod', sql.Char(3), codcolor_prod || '   ');
      insertMaster.input('talla', sql.Char(10), (talla || '').padEnd(10, ' '));
      insertMaster.input('codf', sql.Char(20), cleanCodf.padEnd(20, ' '));
      insertMaster.input('umed', sql.Char(3), umed.substring(0, 3).padEnd(3, ' '));
      insertMaster.input('tipoitm', sql.Int, tipoitm);
      insertMaster.input('msto', sql.Char(1), msto);
      insertMaster.input('aigv', sql.Char(1), aigv);
      insertMaster.input('Usr_003', sql.VarChar(30), (membershipDays > 0 ? membershipDays.toString() : '').padEnd(30, ' '));
      
      insertMaster.input('pcns', sql.Decimal(14, 4), costVal);
      insertMaster.input('pcus', sql.Decimal(14, 4), costVal / 3.75);
      insertMaster.input('funs', sql.Decimal(14, 4), funs);

      await insertMaster.query(`
        INSERT INTO prd0101 (
          codi, descr, marc, codmar, pvns, vvns, igvns, 
          umed, ucom, ucon, estado, mone, tipoitm, codcat, 
          msto, aigv, ubica, fecreg, codcolor_prod, talla,
          pcus, pcns, funs, vvus, pvus, pans, paus, igvus,
          codf, altcodf, altapli, codpaipro, codpaiori, incoterm, codmar_rel,
          obse, cgpack, coddet, catcom, mlote, undemb, persnt, claabc, claabc_r,
          repsto_diap, repsto_diar, repsto_fspp, repsto_asig, repsto_ccom, flagprom,
          CodPart, cens, ceus, hojasegu, hojatecn, hojaadic, mrollo, altcodf_rel,
          Usr_003
        ) VALUES (
          @codi, @descr, @marc, @codmar, @pvns, @vvns, @igvns, 
          @umed, @umed, 1.0000, 1, 'S', @tipoitm, '01', 
          @msto, @aigv, '(01,02,03,04,05,06,07,08,09)                                                                  ', GETDATE(), @codcolor_prod, @talla,
          @pcus, @pcns, @funs, 0.0000, 0.0000, @pcns, @pcus, 0.0000,
          @codf, '                         ', '                                                                                ', '01', '01', '   ', '0000',
          '', 0.0000, '   ', '   ', 0, 0.0000, 0, 'C', 'C',
          0, 0, 0, '     ', '     ', 0,
          '00', 0.0000, 0.0000, '                                                                                                                                                      ', '                                                                                                                                                      ', '                                                                                                                                                      ', 0, '                         ',
          @Usr_003
        )
      `);

      // 6. Buscar tablas secundarias prd01XX
      const tablesRes = await transaction.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME LIKE 'prd01[0-9][0-9]' 
          AND TABLE_NAME <> 'prd0101'
      `);
      const secondaryTables = tablesRes.recordset.map(t => t.TABLE_NAME);

      // 7. Insertar en cascada en las tablas secundarias de sedes
      for (const table of secondaryTables) {
        const insertSec = transaction.request();
        insertSec.input('codi', sql.Char(20), generatedCodi);
        insertSec.input('descr', sql.VarChar(100), cleanDescr.padEnd(100, ' '));
        insertSec.input('marc', sql.VarChar(30), brandName.substring(0, 30).padEnd(30, ' '));
        insertSec.input('pvns', sql.Decimal(14, 4), priceVal);
        insertSec.input('codf', sql.Char(20), cleanCodf.padEnd(20, ' '));
        insertSec.input('umed', sql.Char(3), umed.substring(0, 3).padEnd(3, ' '));
        insertSec.input('msto', sql.Char(1), msto);
        insertSec.input('aigv', sql.Char(1), aigv);
        insertSec.input('tipoitm', sql.Int, tipoitm);
        insertSec.input('igvns', sql.Decimal(14, 4), igvns);
        insertSec.input('vvns', sql.Decimal(14, 4), vvns);
        insertSec.input('Usr_003', sql.VarChar(30), (membershipDays > 0 ? membershipDays.toString() : '').padEnd(30, ' '));
        
        insertSec.input('pcns', sql.Decimal(14, 4), costVal);
        insertSec.input('pcus', sql.Decimal(14, 4), costVal / 3.75);
        insertSec.input('funs', sql.Decimal(14, 4), funs);

        await insertSec.query(`
          INSERT INTO ${table} (
            codi, descr, marc, umed, pvns, estado, codf, stoc, 
            pcus, pcns, funs, vvus, pvus, pans, paus, igvus, igvns, vvns,
            msto, aigv, tipoitm, codcat, Usr_003
          ) VALUES (
            @codi, @descr, @marc, @umed, @pvns, 1, @codf, 0.0000,
            @pcus, @pcns, @funs, 0.0000, 0.0000, @pcns, @pcus, 0.0000, @igvns, @vvns,
            @msto, @aigv, @tipoitm, '01', @Usr_003
          )
        `);
      }

      // 8. Registrar en todas las Listas de Precios (Dtl01Pre)
      const priceListsRes = await transaction.request().query(`
        SELECT LTRIM(RTRIM(CodLis)) as CodLis 
        FROM Tbl_Lista_Precio WITH(nolock)
      `);
      const priceLists = priceListsRes.recordset.map(pl => pl.CodLis);

      for (const codLis of priceLists) {
        const insertPre = transaction.request();
        insertPre.input('CodLis', sql.Char(2), codLis);
        insertPre.input('Codi', sql.Char(20), generatedCodi);
        insertPre.input('vvns', sql.Decimal(14, 4), vvns);
        insertPre.input('pvns', sql.Decimal(14, 4), priceVal);

        await insertPre.query(`
          INSERT INTO Dtl01Pre (
            CodLis, Codi, vvns, pvns, vvus, pvus, RangoIni, RangoFin, 
            dsct, funs, fuus, codcat, fals, Dscto, vvnsE, pvnsE, vvusE, pvusE, nroreg
          ) VALUES (
            @CodLis, @Codi, @vvns, @pvns, 0.0000, 0.0000, 0, 0, 
            0.0000, 0.0000, 0.0000, '01', 0, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0
          )
        `);
      }

      await transaction.commit();
      console.log(`[API Create Product] Producto creado: ${generatedCodi} (${cleanDescr}) con costo ${costVal} en prd0101, propagado a sedes y ${priceLists.length} listas de precios.`);

      return NextResponse.json({
        success: true,
        codi: generatedCodi.trim(),
        descr: cleanDescr.trim(),
        pvns: priceVal,
        propagatedTables: secondaryTables,
        priceListsCount: priceLists.length
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error('[API Create Product] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
