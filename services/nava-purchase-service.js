import sql from 'mssql';
import { getConnection } from '@/lib/db';
import logger from '@/lib/logger';
import { getWarehouseForSede } from '@/lib/erp-utils';

class NavaPurchaseService {
  async create(data, dbName, codusu) {
    const pool = await getConnection(dbName);
    const transaction = new sql.Transaction(pool);

    try {
      logger.info(`[PurchaseService/MSSQL] Iniciando registro de compra en ${dbName}`);

      const {
        idApeCaj,
        supplier, // { codpro, nompro, rucpro }
        docType,  // '01' (FACTURA) o '03' (BOLETA VTA)
        docNumber, // Serie-Numero del proveedor (ej. F001-0001234)
        fechaEmision,
        fechaVencimiento,
        items // Array de { id, quantity, cost }
      } = data;

      if (!idApeCaj) throw new Error("ID de apertura de caja requerido");
      if (!supplier || !supplier.codpro) throw new Error("Proveedor inválido o no especificado");
      if (!docType || !docNumber) throw new Error("Tipo y número de comprobante requeridos");
      if (!items || items.length === 0) throw new Error("La compra debe contener al menos un ítem");

      // 1. Obtener datos de la apertura de caja para resolver punto de venta y usuario
      await transaction.begin();

      const requestApe = new sql.Request(transaction);
      const resApe = await requestApe
        .input('idapecaj', sql.Int, idApeCaj)
        .query(`
          SELECT a.codpto, a.codusu 
          FROM dtl_restpos_apecaj a 
          WHERE a.idapecaj = @idapecaj
        `);

      if (!resApe.recordset[0]) {
        throw new Error(`Sesión de apertura de caja no encontrada: ${idApeCaj}`);
      }

      const erpData = resApe.recordset[0];
      const erpPto = erpData.codpto.trim();
      const erpUsu = erpData.codusu ? erpData.codusu.trim() : (codusu || 'ADMIN');

      // 2. Determinar almacén de forma dinámica
      const resolvedWarehouse = await getWarehouseForSede(transaction, erpPto);
      const warehousePadded = resolvedWarehouse.padStart(2, '0').slice(-2);

      // 3. Configuración de fechas
      const now = new Date();
      const peruvianDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(now);

      const fechaStr = fechaEmision || peruvianDate;
      const fechaVencStr = fechaVencimiento || fechaStr;

      // 4. Obtener tipo de cambio oficial
      const tcaRes = await transaction.request()
        .input('fecha', sql.Date, fechaStr)
        .query("SELECT TOP 1 venta FROM tbl01tca WHERE fecha = @fecha");
      const exchangeRateVal = tcaRes.recordset[0]?.venta || 3.75;

      // 5. Correlativo para la NOTA: INGRESO (cdocu = '29')
      const requestCor = new sql.Request(transaction);
      const resCor = await requestCor
        .input('cdocu', '29')
        .input('codpto', erpPto)
        .query(`SELECT nroini FROM tbl01cor WHERE cdocu = @cdocu AND codpto = @codpto`);

      if (!resCor.recordset[0]) {
        throw new Error(`Sin correlativo registrado para NOTA: INGRESO (29) en el punto ${erpPto}`);
      }

      const currentNroIni = resCor.recordset[0].nroini.trim();
      const parts = currentNroIni.split('-');
      const series = parts[0];
      const numPartClean = (parts[1] || parts[0]).replace(/[^0-9]/g, '');
      const nextNum = (parseInt(numPartClean, 10) + 1).toString().padStart(numPartClean.length, '0');
      const nextNdocu = `${series}-${nextNum}`;

      // Actualizar correlativo de GIM
      await requestCor
        .input('nextNdocu', nextNdocu)
        .query(`UPDATE tbl01cor SET nroini = @nextNdocu WHERE cdocu = @cdocu AND codpto = @codpto`);

      // 6. Generar voucher contable compro en Cuentas por Pagar (Subdiario 02 / Compras)
      const resMaxC = await transaction.request().query(`
        SELECT MAX(compro) as max_compro
        FROM mst01ccp
        WHERE compro LIKE '02/%'
      `);
      
      let nextVoucherNum = 1;
      const maxCompro = resMaxC.recordset[0]?.max_compro;
      if (maxCompro) {
        const vparts = maxCompro.split('/');
        const numPart = parseInt(vparts[1], 10);
        if (!isNaN(numPart)) {
          nextVoucherNum = numPart + 1;
        }
      }
      const nextCompro = `02/${nextVoucherNum.toString().padStart(6, '0')}`;

      // 7. Procesar ítems consultando la maestra de artículos prd0101
      let headerTotalMonto = 0; // Total afecto + IGV
      let headerTotalTota = 0;  // Subtotal neto
      let headerTotalToti = 0;  // IGV total

      const processedItems = [];

      for (const [idx, item] of items.entries()) {
        const itemRes = await transaction.request()
          .input('codi', sql.Char(11), item.id.substring(0, 11))
          .query(`
            SELECT LTRIM(RTRIM(descr)) as descr, 
                   LTRIM(RTRIM(codf)) as codf, 
                   LTRIM(RTRIM(marc)) as marc, 
                   LTRIM(RTRIM(umed)) as umed, 
                   aigv, pvns
            FROM prd0101 WITH(nolock)
            WHERE codi = @codi
          `);

        if (itemRes.recordset.length === 0) {
          throw new Error(`El producto con código ${item.id} no existe en el catálogo maestro ERP`);
        }

        const product = itemRes.recordset[0];
        const itemQty = Number(item.quantity) || 0;
        const itemCostWithIgv = Number(item.cost) || 0; // Costo ingresado (con IGV)

        const isTaxable = product.aigv === 'S';
        
        // Calcular neto y total
        const itemTotal = Number((itemCostWithIgv * itemQty).toFixed(2));
        // Redondeo Navasoft a 1 decimal en subtotal para coincidir contablemente
        const itemSubtotal = isTaxable ? Math.round((itemTotal / 1.18) * 10) / 10 : itemTotal;
        const itemTax = isTaxable ? Number((itemTotal - itemSubtotal).toFixed(2)) : 0;
        
        // Costo unitario neto (sin IGV) para pcns
        const itemNetUnitPrice = isTaxable ? Number((itemCostWithIgv / 1.18).toFixed(4)) : itemCostWithIgv;

        headerTotalMonto += itemTotal;
        headerTotalTota += itemSubtotal;
        headerTotalToti += itemTax;

        processedItems.push({
          id: item.id,
          userCode: product.codf || '',
          brand: product.marc || '',
          name: product.descr || '',
          unit: product.umed || 'UND',
          aigv: product.aigv,
          quantity: itemQty,
          costWithIgv: itemCostWithIgv,
          netUnitPrice: itemNetUnitPrice,
          itemTotal,
          itemSubtotal,
          itemTax
        });
      }

      // Redondear totales de cabecera
      const totalAmount = Number(headerTotalMonto.toFixed(2));
      const subtotalAmount = Number(headerTotalTota.toFixed(2));
      const taxAmount = Number(headerTotalToti.toFixed(2));

      // Normalizar datos del proveedor
      const finalCodpro = supplier.codpro.substring(0, 6);
      const finalNompro = supplier.nompro.trim().toUpperCase().substring(0, 60);
      const finalRucpro = supplier.rucpro ? supplier.rucpro.trim().substring(0, 11) : '';

      // 8. Insertar Cabecera en mst01gim (NOTA: INGRESO, Doc 29)
      const reqMstGim = new sql.Request(transaction);
      await reqMstGim
        .input('fecha', sql.Date, fechaStr)
        .input('ndocu', sql.Char(12), nextNdocu.substring(0, 12))
        .input('crefe', sql.Char(2), docType.substring(0, 2))
        .input('nrefe', sql.Char(12), docNumber.substring(0, 12))
        .input('codpro', sql.Char(6), finalCodpro)
        .input('nompro', sql.Char(60), finalNompro.padEnd(60, ' '))
        .input('rucpro', sql.Char(11), finalRucpro.padEnd(11, ' '))
        .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
        .input('tota', sql.Decimal(18, 2), subtotalAmount)
        .input('toti', sql.Decimal(18, 2), taxAmount)
        .input('totn', sql.Decimal(18, 2), totalAmount)
        .input('codalm', sql.Char(2), resolvedWarehouse)
        .input('codven', sql.Char(5), 'V0001')
        .query(`
          INSERT INTO mst01gim (
            fecha, cdocu, ndocu, crefe, nrefe, nrope, dconf, orde, 
            codpro, nompro, rucpro, guia, mone, tcam, tota, toti, 
            totn, flag, codalm, codglo, cdge, ndge, codven, codscc, 
            egrc, selchk, marchk, autg, codtra, origen, TasFci, FlagTp, 
            motas, tiponc, codmot, fecreg, comesp, Flag_dmt
          ) VALUES (
            @fecha, '29', @ndocu, @crefe, @nrefe, '            ', '          ', '            ',
            @codpro, @nompro, @rucpro, '            ', 'S', @tcam, @tota, @toti,
            @totn, '0', @codalm, '02', '  ', '            ', @codven, '          ',
            0, 0, ' ', 0, 'T0001', 'WEB POS                       ', 0.0, '0',
            '  ', 0, '  ', GETDATE(), 0, 0
          )
        `);

      // 9. Insertar Detalles de GIM, Kardex y Actualizar Inventario
      const kddTable = `kdd01${warehousePadded}`;
      const prdTable = `prd01${warehousePadded}`;

      for (const [idx, item] of processedItems.entries()) {
        // A. Detalle de GIM (dtl01gim)
        const reqDtlGim = new sql.Request(transaction);
        await reqDtlGim
          .input('fecha', sql.Date, fechaStr)
          .input('ndocu', sql.Char(12), nextNdocu.substring(0, 12))
          .input('codpro', sql.Char(6), finalCodpro)
          .input('item', sql.Int, idx + 1)
          .input('codi', sql.Char(11), item.id.substring(0, 11))
          .input('codf', sql.Char(20), item.userCode.substring(0, 20).padEnd(20, ' '))
          .input('marc', sql.Char(5), item.brand.substring(0, 5).padEnd(5, ' '))
          .input('descr', sql.VarChar(80), item.name.substring(0, 80))
          .input('cant', sql.Decimal(18, 4), item.quantity)
          .input('umed', sql.Char(3), item.unit.substring(0, 3).padEnd(3, ' '))
          .input('preu', sql.Decimal(18, 4), item.netUnitPrice)
          .input('tota', sql.Decimal(18, 2), item.itemSubtotal)
          .input('totn', sql.Decimal(18, 2), item.itemTotal)
          .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
          .input('codalm', sql.Char(2), resolvedWarehouse)
          .input('aigv', sql.Char(1), item.aigv)
          .input('cfac', sql.Char(2), docType.substring(0, 2))
          .input('nfac', sql.Char(12), docNumber.substring(0, 12))
          .query(`
            INSERT INTO dtl01gim (
              fecha, cdocu, ndocu, nrope, codpro, orde, item, codi, 
              codf, marc, descr, cant, umed, preu, dsct, dsct2, 
              dsct3, tota, totn, tcam, mone, codalm, aigv, flag, 
              coduc, ucom, uvta, ucon, uckd, msto, peso, pcfle, 
              tofle, pcemb, toemb, dsctnc, cdes, dsct4, dsct5, dsctnc2, 
              dsctnc3, cfac, nfac, cantdev
            ) VALUES (
              @fecha, '29', @ndocu, '            ', @codpro, '            ', @item, @codi,
              @codf, @marc, @descr, @cant, @umed, @preu, 0, 0,
              0, @tota, @totn, @tcam, 'S', @codalm, @aigv, '0',
              ' ', @umed, @umed, 1, 1, 'S', 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0,
              0, @cfac, @nfac, 0
            )
          `);

        // B. Kardex (kdd01xx)
        const reqKdd = new sql.Request(transaction);
        await reqKdd
          .input('fecha', sql.Date, fechaStr)
          .input('ndocu', sql.Char(12), nextNdocu.substring(0, 12))
          .input('codpro', sql.Char(6), finalCodpro)
          .input('nompro', sql.VarChar(50), finalNompro.substring(0, 50))
          .input('nrefe', sql.Char(12), docNumber.substring(0, 12))
          .input('codi', sql.Char(11), item.id.substring(0, 11))
          .input('cant', sql.Decimal(18, 4), item.quantity)
          .input('cost', sql.Decimal(18, 4), item.costWithIgv)
          .input('tota', sql.Decimal(18, 2), item.itemTotal)
          .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
          .input('cfac', sql.Char(2), docType.substring(0, 2))
          .input('nfac', sql.Char(12), docNumber.substring(0, 12))
          .input('codpto', sql.Char(2), erpPto)
          .query(`
            INSERT INTO ${kddTable} (
              fecha, cdocu, ndocu, codn, nomb, refe, tmov, codi, 
              cant, preu, dsct, tota, tcam, mone, cost, codglo, 
              nomglo, aigv, cfac, nfac, codven, CodPto, CodTur, uvta, 
              pigv, pcfle, pcemb
            ) VALUES (
              @fecha, '29', @ndocu, @codpro, @nompro, @nrefe, 'E', @codi,
              @cant, @cost, 0, @tota, @tcam, 'S', @cost, '02',
              'COMPRA NACIONAL', @aigv, @cfac, @nfac, 'V0001', @codpto, '01', 1,
              18, 0, 0
            )
          `);

        // C. Actualizar Stock, Costo y Utilidad en el Almacén local y Catálogo Maestro
        const reqUpdateStock = new sql.Request(transaction);
        await reqUpdateStock
          .input('codi', sql.Char(11), item.id.substring(0, 11))
          .input('cant', sql.Decimal(18, 4), item.quantity)
          .input('fecha', sql.Date, fechaStr)
          .input('costNet', sql.Decimal(14, 4), item.netUnitPrice)
          .query(`
            IF OBJECT_ID('dbo.${prdTable}') IS NOT NULL
            BEGIN
              UPDATE ${prdTable}
              SET stoc = stoc + @cant,
                  ufco = @fecha,
                  pcns = @costNet,
                  pans = pcns,
                  funs = CASE WHEN aigv = 'N' THEN pvns ELSE (pvns / 1.18) END - @costNet
              WHERE codi = @codi
            END
          `);

        if (resolvedWarehouse !== '01') {
          const reqUpdateMaster = new sql.Request(transaction);
          await reqUpdateMaster
            .input('codi', sql.Char(11), item.id.substring(0, 11))
            .input('fecha', sql.Date, fechaStr)
            .input('costNet', sql.Decimal(14, 4), item.netUnitPrice)
            .query(`
              UPDATE prd0101
              SET ufco = @fecha,
                  pcns = @costNet,
                  pans = pcns,
                  funs = CASE WHEN aigv = 'N' THEN pvns ELSE (pvns / 1.18) END - @costNet
              WHERE codi = @codi
            `);
        }
      }

      // 10. Insertar en Cuentas por Pagar (CCP Header - mst01ccp)
      const firstItemName = processedItems[0]?.name.substring(0, 50) || 'COMPRA MERCADERIA';
      const displayGlosa = `COMPRA: ${firstItemName}`.substring(0, 100);

      const reqMstCcp = new sql.Request(transaction);
      await reqMstCcp
        .input('fecha', sql.Date, fechaStr)
        .input('cdocu', sql.Char(2), docType.substring(0, 2))
        .input('ndocu', sql.Char(12), docNumber.substring(0, 12))
        .input('nrefe', sql.Char(12), nextNdocu.substring(0, 12)) // Referencia a la Nota de Ingreso GIM
        .input('codpro', sql.Char(6), finalCodpro)
        .input('nompro', sql.VarChar(60), finalNompro)
        .input('rucpro', sql.Char(11), finalRucpro.padEnd(11, ' '))
        .input('monto', sql.Decimal(18, 2), totalAmount)
        .input('fven', sql.Date, fechaVencStr)
        .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
        .input('glosa', sql.VarChar(100), displayGlosa.padEnd(100, ' '))
        .input('compro', sql.Char(9), nextCompro.padEnd(9, ' '))
        .query(`
          INSERT INTO mst01ccp (
            fecha, cdocu, ndocu, crefe, nrefe, codpro, nompro, rucpro, 
            codcdc, monto, saldo, dias, fven, mora, uabo, tcam, 
            mone, flag, cuenta, glosa, codest, codbco, nombco, unibco, 
            agebco, fcam, fren, fpro, feco, flagi, flagp, flagc, 
            flacje, compro, selchk, marchk, FecAju, TcaOld, codsub, 
            nrope, NumPre, tiponc, persnt, imone, itcam, imonto, 
            codccp, cuentaold, codscc, codpos, Leasing, cuota, capital, 
            intdiferido, igvdiferido, comestruc, otrosgasto, totalcuota, nrodua, 
            attach, codafp, rhaporte, afpcomi, afpsegu, tipocom_afp, fecreg, 
            valref, fppag, obse_logistica, Flag_Conf_alm, prioridad, tasa
          ) VALUES (
            @fecha, @cdocu, @ndocu, '29', @nrefe, @codpro, @nompro, @rucpro,
            '01', @monto, @monto, 0, @fven, 0.00, NULL, @tcam,
            'S', '0', '42121     ', @glosa, '01', '  ', '', '          ',
            '          ', NULL, NULL, NULL, NULL, NULL, 0, 0,
            0, @compro, 0, ' ', @fecha, 0.0000, '  ',
            NULL, '            ', 0, 0, ' ', 0.0000, 0.00,
            '01', NULL, '          ', '             ', '            ', 0, 0.00,
            0.00, 0.00, 0.00, 0.00, 0.00, '                                                  ',
            0, '  ', 0.00, 0.00, 0.00, 0, GETDATE(),
            0.00, NULL, '', 0, 0, 0.00
          )
        `);

      // 11. Insertar en Cuentas por Pagar (CCP Detail - dtl01ccp)
      const reqDtlCcp = new sql.Request(transaction);
      await reqDtlCcp
        .input('fecha', sql.Date, fechaStr)
        .input('codpro', sql.Char(6), finalCodpro)
        .input('cdocu', sql.Char(2), docType.substring(0, 2))
        .input('ndocu', sql.Char(12), docNumber.substring(0, 12))
        .input('glosa', sql.VarChar(100), displayGlosa.padEnd(100, ' '))
        .input('cargo', sql.Decimal(18, 2), totalAmount)
        .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
        .input('compro', sql.Char(9), nextCompro.padEnd(9, ' '))
        .query(`
          INSERT INTO dtl01ccp (
            fecha, codpro, tmov, cdocu, ndocu, crefe, nrefe, glosa, 
            cargo, abono, mone, tcam, cpago, mpago, npago, ipago, 
            nplan, idunico, fecreg, compro
          ) VALUES (
            @fecha, @codpro, 'C', @cdocu, @ndocu, @cdocu, @ndocu, @glosa,
            @cargo, 0, 'S', @tcam, ' ', ' ', '            ', 0,
            '            ', NEWID(), GETDATE(), @compro
          )
        `);

      await transaction.commit();
      logger.info(`[PurchaseService/MSSQL] Compra registrada con éxito. NOTA: INGRESO = ${nextNdocu}, Obligación CCP = ${docType}-${docNumber}, Voucher Compras = ${nextCompro}`);

      return {
        success: true,
        notaIngreso: nextNdocu,
        voucher: nextCompro,
        docType,
        docNumber,
        total: totalAmount,
        subtotal: subtotalAmount,
        igv: taxAmount,
        supplier: {
          codpro: finalCodpro,
          nompro: finalNompro,
          rucpro: finalRucpro
        }
      };

    } catch (err) {
      logger.error(`[PurchaseService/MSSQL] ERROR CRÍTICO al registrar compra: ${err.message}`);
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        logger.error(`[PurchaseService/MSSQL] Falló rollback de transacción: ${rollbackErr.message}`);
      }
      throw err;
    }
  }

  async createOCM(data, dbName, codusu) {
    const pool = await getConnection(dbName);
    const transaction = new sql.Transaction(pool);

    try {
      logger.info(`[PurchaseService/MSSQL] Iniciando registro de Orden de Compra (OCM) en ${dbName}`);

      const {
        idApeCaj,
        supplier, // { codpro, nompro, rucpro }
        fechaEmision,
        fechaVencimiento,
        items, // Array de { id, quantity, cost, codalm } (cost = unit cost with IGV)
        cond,
        codcoc,
        fechaEntrega,
        fechaCaducidad,
        lugarEntrega,
        observacion,
        codtra,
        nombco,
        nrocta
      } = data;

      if (!idApeCaj) throw new Error("ID de apertura de caja requerido");
      if (!supplier || !supplier.codpro) throw new Error("Proveedor inválido o no especificado");
      if (!items || items.length === 0) throw new Error("La orden debe contener al menos un ítem");

      await transaction.begin();

      // 1. Resolver punto de venta y usuario
      const requestApe = new sql.Request(transaction);
      const resApe = await requestApe
        .input('idapecaj', sql.Int, idApeCaj)
        .query(`
          SELECT a.codpto, a.codusu 
          FROM dtl_restpos_apecaj a 
          WHERE a.idapecaj = @idapecaj
        `);

      if (!resApe.recordset[0]) {
        throw new Error(`Sesión de apertura de caja no encontrada: ${idApeCaj}`);
      }

      const erpData = resApe.recordset[0];
      const erpPto = erpData.codpto.trim();
      const erpUsu = erpData.codusu ? erpData.codusu.trim() : (codusu || 'ADMIN');

      // 2. Determinar almacén
      const resolvedWarehouse = await getWarehouseForSede(transaction, erpPto);

      // 3. Fechas
      const now = new Date();
      const peruvianDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(now);

      const fechaStr = fechaEmision || peruvianDate;
      const fechaVencStr = fechaVencimiento || fechaStr;
      const fechaEntregaStr = fechaEntrega || fechaVencStr;
      
      // Calcular fecha de caducidad por defecto (Emisión + 90 días) si no viene configurada
      let fechaCaducidadStr = fechaCaducidad;
      if (!fechaCaducidadStr) {
        const dCad = new Date(fechaStr);
        dCad.setDate(dCad.getDate() + 90);
        fechaCaducidadStr = dCad.toISOString().split('T')[0];
      }

      // 4. Tipo de cambio
      const tcaRes = await transaction.request()
        .input('fecha', sql.Date, fechaStr)
        .query("SELECT TOP 1 venta FROM tbl01tca WHERE fecha = @fecha");
      const exchangeRateVal = tcaRes.recordset[0]?.venta || 3.75;

      // 5. Correlativo OCM (cdocu = '28')
      const requestCor = new sql.Request(transaction);
      const resCor = await requestCor
        .input('cdocu', '28')
        .input('codpto', erpPto)
        .query(`SELECT nroini FROM tbl01cor WHERE cdocu = @cdocu AND codpto = @codpto`);

      if (!resCor.recordset[0]) {
        throw new Error(`Sin correlativo registrado para ORDEN COMPRA (28) en el punto ${erpPto}`);
      }

      const currentNroIni = resCor.recordset[0].nroini.trim();
      const parts = currentNroIni.split('-');
      const series = parts[0];
      const numPartClean = (parts[1] || parts[0]).replace(/[^0-9]/g, '');
      const nextNum = (parseInt(numPartClean, 10) + 1).toString().padStart(numPartClean.length, '0');
      const nextNdocu = `${series}-${nextNum}`;

      // Actualizar correlativo de OCM
      await requestCor
        .input('nextNdocu', nextNdocu)
        .query(`UPDATE tbl01cor SET nroini = @nextNdocu WHERE cdocu = @cdocu AND codpto = @codpto`);

      // 6. Procesar items
      let headerTotalMonto = 0; 
      let headerTotalTota = 0;  
      let headerTotalToti = 0;  

      const processedItems = [];

      for (const [idx, item] of items.entries()) {
        const itemRes = await transaction.request()
          .input('codi', sql.Char(11), item.id.substring(0, 11))
          .query(`
            SELECT LTRIM(RTRIM(descr)) as descr, 
                   LTRIM(RTRIM(codf)) as codf, 
                   LTRIM(RTRIM(marc)) as marc, 
                   LTRIM(RTRIM(umed)) as umed, 
                   aigv
            FROM prd0101 WITH(nolock)
            WHERE codi = @codi
          `);

        if (itemRes.recordset.length === 0) {
          throw new Error(`El producto con código ${item.id} no existe en el catálogo maestro ERP`);
        }

        const product = itemRes.recordset[0];
        const itemQty = Number(item.quantity) || 0;
        const itemCostWithIgv = Number(item.cost) || 0;

        const isTaxable = product.aigv === 'S';
        const itemTotal = Number((itemCostWithIgv * itemQty).toFixed(2));
        const itemSubtotal = isTaxable ? Math.round((itemTotal / 1.18) * 10) / 10 : itemTotal;
        const itemTax = isTaxable ? Number((itemTotal - itemSubtotal).toFixed(2)) : 0;
        const itemNetUnitPrice = isTaxable ? Number((itemCostWithIgv / 1.18).toFixed(4)) : itemCostWithIgv;

        headerTotalMonto += itemTotal;
        headerTotalTota += itemSubtotal;
        headerTotalToti += itemTax;

        processedItems.push({
          id: item.id,
          userCode: product.codf || '',
          brand: product.marc || '',
          name: product.descr || '',
          unit: product.umed || 'UND',
          aigv: product.aigv,
          quantity: itemQty,
          costWithIgv: itemCostWithIgv,
          netUnitPrice: itemNetUnitPrice,
          itemTotal,
          itemSubtotal,
          itemTax,
          codalm: item.codalm || resolvedWarehouse // Asignación de almacén individual
        });
      }

      const totalAmount = Number(headerTotalMonto.toFixed(2));
      const subtotalAmount = Number(headerTotalTota.toFixed(2));
      const taxAmount = Number(headerTotalToti.toFixed(2));

      const finalCodpro = supplier.codpro.substring(0, 6);
      const finalNompro = supplier.nompro.trim().toUpperCase().substring(0, 60);
      const finalRucpro = supplier.rucpro ? supplier.rucpro.trim().substring(0, 11) : '';
      const finalCond = cond ? cond.trim().toUpperCase() : 'CONTADO';
      const finalCodcoc = codcoc ? codcoc.trim() : '01';

      // 7. Insertar en mst01ocm
      const reqMstOcm = new sql.Request(transaction);
      await reqMstOcm
        .input('fecha', sql.Date, fechaStr)
        .input('ndocu', sql.Char(12), nextNdocu.substring(0, 12))
        .input('codpro', sql.Char(6), finalCodpro)
        .input('nompro', sql.Char(60), finalNompro.padEnd(60, ' '))
        .input('rucpro', sql.Char(11), finalRucpro.padEnd(11, ' '))
        .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
        .input('totb', sql.Decimal(18, 2), subtotalAmount)
        .input('tota', sql.Decimal(18, 2), subtotalAmount)
        .input('toti', sql.Decimal(18, 2), taxAmount)
        .input('totn', sql.Decimal(18, 2), totalAmount)
        .input('fven', sql.Date, fechaEntregaStr)
        .input('codalm', sql.Char(2), processedItems[0]?.codalm || resolvedWarehouse) // Almacén de cabecera por defecto
        .input('codusu', sql.Char(3), erpUsu.substring(0, 3))
        .input('cond', sql.VarChar(80), finalCond.padEnd(80, ' '))
        .input('codcoc', sql.Char(2), finalCodcoc)
        .input('feccad', sql.Date, fechaCaducidadStr)
        .input('entr', sql.Char(60), (lugarEntrega || 'LUIS GONZALES').substring(0, 60).padEnd(60, ' '))
        .input('obse', sql.VarChar(100), (observacion || '').substring(0, 100))
        .input('codtra', sql.Char(5), (codtra || 'T0000').substring(0, 5))
        .input('nombco', sql.Char(15), (nombco || '').substring(0, 15))
        .input('nrocta', sql.Char(20), (nrocta || '').substring(0, 20))
        .query(`
          INSERT INTO mst01ocm (
            fecha, cdocu, ndocu, codpro, nompro, rucpro, atte, refe, mone, tcam,
            totb, dsct, tota, toti, totn, fven, flag, entr, obse, cond,
            nota, codalm, ccos, dest, impor, chkimp, selchk, marchk, genn,
            CodTra, NomBco, NroCta, alta, codcoc, flagnc, codscc, nrope,
            reffab, paymen, delive, insura, bankex, freigh, obser, dconfi,
            fconfi, preu, freffa, tiptra, NumEst, NumCot, shipto, tipocm,
            refefac, FlagCc, cdge, ndge, nroped, nropro, codcom, fecreg,
            inafec, feccad, apro, aprofec, aprousu, aproobs, checkok, genop,
            CodCdc, confirm, attach, codtie, origen, codpai, agecar, codusu,
            idarea, comesp, atte_item1, atte_item2, agecar_item, flaenv, codenv, fecenv
          ) VALUES (
            @fecha, '28', @ndocu, @codpro, @nompro, @rucpro, '                              ', '            ', 'S', @tcam,
            @totb, 0, @tota, @toti, @totn, @fven, '0', @entr, @obse, @cond,
            '            ', @codalm, '', '                                        ', 0, 0, 0, ' ', 0,
            @codtra, @nombco, @nrocta, 0, @codcoc, 1, '          ', '            ',
            '', '', '', '', '', '', '', '               ',
            NULL, 0, NULL, ' ', '            ', '            ', '', '0',
            '                    ', '0 ', '  ', '            ', '', '', 'V0000', GETDATE(),
            0, @feccad, 1, GETDATE(), @codusu, '                                                                                                    ', 0, 0,
            '01', 0, 0, '   ', 0, '  ', '', @codusu,
            1, 0, 0, 0, 0, 0, '      ', NULL
          )
        `);

      // 8. Insertar detalles en dtl01ocm
      for (const [idx, item] of processedItems.entries()) {
        const reqDtlOcm = new sql.Request(transaction);
        await reqDtlOcm
          .input('fecha', sql.Date, fechaStr)
          .input('ndocu', sql.Char(12), nextNdocu.substring(0, 12))
          .input('codpro', sql.Char(6), finalCodpro)
          .input('item', sql.Int, idx + 1)
          .input('codi', sql.Char(11), item.id.substring(0, 11))
          .input('codf', sql.Char(20), item.userCode.substring(0, 20).padEnd(20, ' '))
          .input('marc', sql.Char(5), item.brand.substring(0, 5).padEnd(5, ' '))
          .input('descr', sql.VarChar(80), item.name.substring(0, 80))
          .input('cant', sql.Decimal(18, 4), item.quantity)
          .input('preu', sql.Decimal(18, 4), item.netUnitPrice)
          .input('totb', sql.Decimal(18, 2), item.itemSubtotal)
          .input('tota', sql.Decimal(18, 2), item.itemSubtotal)
          .input('totn', sql.Decimal(18, 2), item.itemTotal)
          .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
          .input('codalm', sql.Char(2), item.codalm)
          .input('aigv', sql.Char(1), item.aigv)
          .query(`
            INSERT INTO dtl01ocm (
              fecha, cdocu, ndocu, codpro, item, codi, codf, marc, descr, umed,
              cant, preu, totb, dsct, dsct2, dsct3, tota, totn, tcam, mone,
              flag, recib, codalm, aigv, flad, coduc, ucom, uvta, ucon, uckd,
              msto, dsctnc, cancon, desrem, tipocm, alta, dsct4, dsct5, dsctnc2,
              dsctnc3, preucon, confirm, codmotalt
            ) VALUES (
              @fecha, '28', @ndocu, @codpro, @item, @codi, @codf, @marc, @descr, @umed,
              @cant, @preu, @totb, 0, 0, 0, @tota, @totn, @tcam, 'S',
              '0', 0, @codalm, @aigv, ' ', ' ', @umed, '   ', 1, 0,
              'S', 0, 0, '', ' ', 0, 0, 0, 0,
              0, 0, 0, '01'
            )
          `);
      }

      await transaction.commit();
      logger.info(`[PurchaseService/MSSQL] Orden de Compra registrada con éxito: ${nextNdocu}`);

      return {
        success: true,
        ndocu: nextNdocu,
        total: totalAmount,
        subtotal: subtotalAmount,
        igv: taxAmount,
        supplier: {
          codpro: finalCodpro,
          nompro: finalNompro,
          rucpro: finalRucpro
        }
      };

    } catch (err) {
      logger.error(`[PurchaseService/MSSQL] ERROR al registrar Orden de Compra: ${err.message}`);
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        logger.error(`[PurchaseService/MSSQL] Falló rollback de transacción OCM: ${rollbackErr.message}`);
      }
      throw err;
    }
  }

  async createGIM(data, dbName, codusu) {
    const pool = await getConnection(dbName);
    const transaction = new sql.Transaction(pool);

    try {
      logger.info(`[PurchaseService/MSSQL] Iniciando registro de Nota de Ingreso (GIM) en ${dbName}`);

      const {
        idApeCaj,
        supplier, // { codpro, nompro, rucpro }
        fechaEmision,
        ocmNumber, // Opcional (si jala de una OCM)
        docNumber, // Opcional (número físico de guía del proveedor)
        items // Array de { id, quantity, cost } (cost = unit cost with IGV)
      } = data;

      if (!idApeCaj) throw new Error("ID de apertura de caja requerido");
      if (!supplier || !supplier.codpro) throw new Error("Proveedor inválido o no especificado");
      if (!items || items.length === 0) throw new Error("La nota de ingreso debe contener al menos un ítem");

      await transaction.begin();

      // 1. Resolver punto de venta y usuario
      const requestApe = new sql.Request(transaction);
      const resApe = await requestApe
        .input('idapecaj', sql.Int, idApeCaj)
        .query(`
          SELECT a.codpto, a.codusu 
          FROM dtl_restpos_apecaj a 
          WHERE a.idapecaj = @idapecaj
        `);

      if (!resApe.recordset[0]) {
        throw new Error(`Sesión de apertura de caja no encontrada: ${idApeCaj}`);
      }

      const erpData = resApe.recordset[0];
      const erpPto = erpData.codpto.trim();
      const erpUsu = erpData.codusu ? erpData.codusu.trim() : (codusu || 'ADMIN');

      // 2. Determinar almacén
      const resolvedWarehouse = await getWarehouseForSede(transaction, erpPto);
      const warehousePadded = resolvedWarehouse.padStart(2, '0').slice(-2);

      // 3. Fechas
      const now = new Date();
      const peruvianDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(now);

      const fechaStr = fechaEmision || peruvianDate;

      // 4. Tipo de cambio
      const tcaRes = await transaction.request()
        .input('fecha', sql.Date, fechaStr)
        .query("SELECT TOP 1 venta FROM tbl01tca WHERE fecha = @fecha");
      const exchangeRateVal = tcaRes.recordset[0]?.venta || 3.75;

      // 5. Correlativo GIM (cdocu = '29')
      const requestCor = new sql.Request(transaction);
      const resCor = await requestCor
        .input('cdocu', '29')
        .input('codpto', erpPto)
        .query(`SELECT nroini FROM tbl01cor WHERE cdocu = @cdocu AND codpto = @codpto`);

      if (!resCor.recordset[0]) {
        throw new Error(`Sin correlativo registrado para NOTA: INGRESO (29) en el punto ${erpPto}`);
      }

      const currentNroIni = resCor.recordset[0].nroini.trim();
      const parts = currentNroIni.split('-');
      const series = parts[0];
      const numPartClean = (parts[1] || parts[0]).replace(/[^0-9]/g, '');
      const nextNum = (parseInt(numPartClean, 10) + 1).toString().padStart(numPartClean.length, '0');
      const nextNdocu = `${series}-${nextNum}`;

      // Actualizar correlativo de GIM
      await requestCor
        .input('nextNdocu', nextNdocu)
        .query(`UPDATE tbl01cor SET nroini = @nextNdocu WHERE cdocu = @cdocu AND codpto = @codpto`);

      // 6. Procesar items
      let headerTotalMonto = 0; 
      let headerTotalTota = 0;  
      let headerTotalToti = 0;  

      const processedItems = [];

      for (const [idx, item] of items.entries()) {
        const itemRes = await transaction.request()
          .input('codi', sql.Char(11), item.id.substring(0, 11))
          .query(`
            SELECT LTRIM(RTRIM(descr)) as descr, 
                   LTRIM(RTRIM(codf)) as codf, 
                   LTRIM(RTRIM(marc)) as marc, 
                   LTRIM(RTRIM(umed)) as umed, 
                   aigv
            FROM prd0101 WITH(nolock)
            WHERE codi = @codi
          `);

        if (itemRes.recordset.length === 0) {
          throw new Error(`El producto con código ${item.id} no existe en el catálogo maestro ERP`);
        }

        const product = itemRes.recordset[0];
        const itemQty = Number(item.quantity) || 0;
        const itemCostWithIgv = Number(item.cost) || 0;

        const isTaxable = product.aigv === 'S';
        const itemTotal = Number((itemCostWithIgv * itemQty).toFixed(2));
        const itemSubtotal = isTaxable ? Math.round((itemTotal / 1.18) * 10) / 10 : itemTotal;
        const itemTax = isTaxable ? Number((itemTotal - itemSubtotal).toFixed(2)) : 0;
        const itemNetUnitPrice = isTaxable ? Number((itemCostWithIgv / 1.18).toFixed(4)) : itemCostWithIgv;

        headerTotalMonto += itemTotal;
        headerTotalTota += itemSubtotal;
        headerTotalToti += itemTax;

        processedItems.push({
          id: item.id,
          userCode: product.codf || '',
          brand: product.marc || '',
          name: product.descr || '',
          unit: product.umed || 'UND',
          aigv: product.aigv,
          quantity: itemQty,
          costWithIgv: itemCostWithIgv,
          netUnitPrice: itemNetUnitPrice,
          itemTotal,
          itemSubtotal,
          itemTax
        });
      }

      const totalAmount = Number(headerTotalMonto.toFixed(2));
      const subtotalAmount = Number(headerTotalTota.toFixed(2));
      const taxAmount = Number(headerTotalToti.toFixed(2));

      const finalCodpro = supplier.codpro.substring(0, 6);
      const finalNompro = supplier.nompro.trim().toUpperCase().substring(0, 60);
      const finalRucpro = supplier.rucpro ? supplier.rucpro.trim().substring(0, 11) : '';

      const finalCrefe = ocmNumber ? '28' : '  ';
      const finalNrefe = ocmNumber ? ocmNumber.substring(0, 12) : (docNumber ? docNumber.substring(0, 12) : '            ');

      // 7. Insertar en mst01gim
      const reqMstGim = new sql.Request(transaction);
      await reqMstGim
        .input('fecha', sql.Date, fechaStr)
        .input('ndocu', sql.Char(12), nextNdocu.substring(0, 12))
        .input('crefe', sql.Char(2), finalCrefe)
        .input('nrefe', sql.Char(12), finalNrefe)
        .input('codpro', sql.Char(6), finalCodpro)
        .input('nompro', sql.Char(60), finalNompro.padEnd(60, ' '))
        .input('rucpro', sql.Char(11), finalRucpro.padEnd(11, ' '))
        .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
        .input('tota', sql.Decimal(18, 2), subtotalAmount)
        .input('toti', sql.Decimal(18, 2), taxAmount)
        .input('totn', sql.Decimal(18, 2), totalAmount)
        .input('codalm', sql.Char(2), resolvedWarehouse)
        .input('codven', sql.Char(5), 'V0001')
        .query(`
          INSERT INTO mst01gim (
            fecha, cdocu, ndocu, crefe, nrefe, nrope, dconf, orde, 
            codpro, nompro, rucpro, guia, mone, tcam, tota, toti, 
            totn, flag, codalm, codglo, cdge, ndge, codven, codscc, 
            egrc, selchk, marchk, autg, codtra, origen, TasFci, FlagTp, 
            motas, tiponc, codmot, fecreg, comesp, Flag_dmt
          ) VALUES (
            @fecha, '29', @ndocu, @crefe, @nrefe, '            ', '          ', '            ',
            @codpro, @nompro, @rucpro, '            ', 'S', @tcam, @tota, @toti,
            @totn, '0', @codalm, '02', '  ', '            ', @codven, '          ',
            0, 0, ' ', 0, 'T0001', 'WEB POS                       ', 0.0, '0',
            '  ', 0, '  ', GETDATE(), 0, 0
          )
        `);

      // 8. Insertar detalles, actualizar Kardex e inventario
      const kddTable = `kdd01${warehousePadded}`;
      const prdTable = `prd01${warehousePadded}`;

      for (const [idx, item] of processedItems.entries()) {
        // A. Detalle de GIM (dtl01gim)
        const reqDtlGim = new sql.Request(transaction);
        await reqDtlGim
          .input('fecha', sql.Date, fechaStr)
          .input('ndocu', sql.Char(12), nextNdocu.substring(0, 12))
          .input('codpro', sql.Char(6), finalCodpro)
          .input('item', sql.Int, idx + 1)
          .input('codi', sql.Char(11), item.id.substring(0, 11))
          .input('codf', sql.Char(20), item.userCode.substring(0, 20).padEnd(20, ' '))
          .input('marc', sql.Char(5), item.brand.substring(0, 5).padEnd(5, ' '))
          .input('descr', sql.VarChar(80), item.name.substring(0, 80))
          .input('cant', sql.Decimal(18, 4), item.quantity)
          .input('umed', sql.Char(3), item.unit.substring(0, 3).padEnd(3, ' '))
          .input('preu', sql.Decimal(18, 4), item.netUnitPrice)
          .input('tota', sql.Decimal(18, 2), item.itemSubtotal)
          .input('totn', sql.Decimal(18, 2), item.itemTotal)
          .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
          .input('codalm', sql.Char(2), resolvedWarehouse)
          .input('aigv', sql.Char(1), item.aigv)
          .query(`
            INSERT INTO dtl01gim (
              fecha, cdocu, ndocu, nrope, codpro, orde, item, codi, 
              codf, marc, descr, cant, umed, preu, dsct, dsct2, 
              dsct3, tota, totn, tcam, mone, codalm, aigv, flag, 
              coduc, ucom, uvta, ucon, uckd, msto, peso, pcfle, 
              tofle, pcemb, toemb, dsctnc, cdes, dsct4, dsct5, dsctnc2, 
              dsctnc3, cfac, nfac, cantdev
            ) VALUES (
              @fecha, '29', @ndocu, '            ', @codpro, '            ', @item, @codi,
              @codf, @marc, @descr, @cant, @umed, @preu, 0, 0,
              0, @tota, @totn, @tcam, 'S', @codalm, @aigv, '0',
              ' ', @umed, @umed, 1, 1, 'S', 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0,
              0, '  ', '            ', 0
            )
          `);

        // B. Kardex (kdd01xx)
        const reqKdd = new sql.Request(transaction);
        await reqKdd
          .input('fecha', sql.Date, fechaStr)
          .input('ndocu', sql.Char(12), nextNdocu.substring(0, 12))
          .input('codpro', sql.Char(6), finalCodpro)
          .input('nompro', sql.VarChar(50), finalNompro.substring(0, 50))
          .input('nrefe', sql.Char(12), finalNrefe)
          .input('codi', sql.Char(11), item.id.substring(0, 11))
          .input('cant', sql.Decimal(18, 4), item.quantity)
          .input('cost', sql.Decimal(18, 4), item.costWithIgv)
          .input('tota', sql.Decimal(18, 2), item.itemTotal)
          .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
          .input('codpto', sql.Char(2), erpPto)
          .query(`
            INSERT INTO ${kddTable} (
              fecha, cdocu, ndocu, codn, nomb, refe, tmov, codi, 
              cant, preu, dsct, tota, tcam, mone, cost, codglo, 
              nomglo, aigv, cfac, nfac, codven, CodPto, CodTur, uvta, 
              pigv, pcfle, pcemb
            ) VALUES (
              @fecha, '29', @ndocu, @codpro, @nompro, @nrefe, 'E', @codi,
              @cant, @cost, 0, @tota, @tcam, 'S', @cost, '02',
              'COMPRA NACIONAL', @aigv, '  ', '            ', 'V0001', @codpto, '01', 1,
              18, 0, 0
            )
          `);

        // C. Actualizar Stock
        const reqUpdateStock = new sql.Request(transaction);
        await reqUpdateStock
          .input('codi', sql.Char(11), item.id.substring(0, 11))
          .input('cant', sql.Decimal(18, 4), item.quantity)
          .input('fecha', sql.Date, fechaStr)
          .input('costNet', sql.Decimal(14, 4), item.netUnitPrice)
          .query(`
            IF OBJECT_ID('dbo.${prdTable}') IS NOT NULL
            BEGIN
              UPDATE ${prdTable}
              SET stoc = stoc + @cant,
                  ufco = @fecha,
                  pcns = @costNet,
                  pans = pcns,
                  funs = CASE WHEN aigv = 'N' THEN pvns ELSE (pvns / 1.18) END - @costNet
              WHERE codi = @codi
            END
          `);

        if (resolvedWarehouse !== '01') {
          const reqUpdateMaster = new sql.Request(transaction);
          await reqUpdateMaster
            .input('codi', sql.Char(11), item.id.substring(0, 11))
            .input('fecha', sql.Date, fechaStr)
            .input('costNet', sql.Decimal(14, 4), item.netUnitPrice)
            .query(`
              UPDATE prd0101
              SET ufco = @fecha,
                  pcns = @costNet,
                  pans = pcns,
                  funs = CASE WHEN aigv = 'N' THEN pvns ELSE (pvns / 1.18) END - @costNet
              WHERE codi = @codi
            `);
        }

        // D. Actualizar cantidades recibidas en OCM (si es referenciada)
        if (ocmNumber) {
          const reqUpdateOcm = new sql.Request(transaction);
          await reqUpdateOcm
            .input('ocmNumber', sql.Char(12), ocmNumber.substring(0, 12))
            .input('codi', sql.Char(11), item.id.substring(0, 11))
            .input('cant', sql.Decimal(18, 4), item.quantity)
            .query(`
              UPDATE dtl01ocm 
              SET recib = recib + @cant 
              WHERE ndocu = @ocmNumber AND codi = @codi
            `);
        }
      }

      await transaction.commit();
      logger.info(`[PurchaseService/MSSQL] Nota de Ingreso registrada con éxito: ${nextNdocu}`);

      return {
        success: true,
        ndocu: nextNdocu,
        total: totalAmount,
        subtotal: subtotalAmount,
        igv: taxAmount,
        supplier: {
          codpro: finalCodpro,
          nompro: finalNompro,
          rucpro: finalRucpro
        }
      };

    } catch (err) {
      logger.error(`[PurchaseService/MSSQL] ERROR al registrar Nota de Ingreso: ${err.message}`);
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        logger.error(`[PurchaseService/MSSQL] Falló rollback de transacción GIM: ${rollbackErr.message}`);
      }
      throw err;
    }
  }

  async createCCP(data, dbName, codusu) {
    const pool = await getConnection(dbName);
    const transaction = new sql.Transaction(pool);

    try {
      logger.info(`[PurchaseService/MSSQL] Iniciando registro de Provisión de Factura/Boleta de Compra (CCP) en ${dbName}`);

      const {
        idApeCaj,
        supplier, // { codpro, nompro, rucpro }
        docType,  // '01' (FACTURA) o '03' (BOLETA VTA)
        docNumber, // Serie-Numero del proveedor (ej. F001-0001234)
        gimNumber, // Opcional (si se asocia a una Nota de Ingreso GIM)
        fechaEmision,
        fechaVencimiento,
        items // Array de { id, quantity, cost } (cost = unit cost with IGV)
      } = data;

      if (!idApeCaj) throw new Error("ID de apertura de caja requerido");
      if (!supplier || !supplier.codpro) throw new Error("Proveedor inválido o no especificado");
      if (!docType || !docNumber) throw new Error("Tipo y número de comprobante requeridos");
      if (!items || items.length === 0) throw new Error("El comprobante debe contener al menos un ítem");

      await transaction.begin();

      // 1. Resolver punto de venta y usuario
      const requestApe = new sql.Request(transaction);
      const resApe = await requestApe
        .input('idapecaj', sql.Int, idApeCaj)
        .query(`
          SELECT a.codpto, a.codusu 
          FROM dtl_restpos_apecaj a 
          WHERE a.idapecaj = @idapecaj
        `);

      if (!resApe.recordset[0]) {
        throw new Error(`Sesión de apertura de caja no encontrada: ${idApeCaj}`);
      }

      const erpData = resApe.recordset[0];
      const erpPto = erpData.codpto.trim();
      const erpUsu = erpData.codusu ? erpData.codusu.trim() : (codusu || 'ADMIN');

      // 2. Fechas
      const now = new Date();
      const peruvianDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(now);

      const fechaStr = fechaEmision || peruvianDate;
      const fechaVencStr = fechaVencimiento || fechaStr;

      // 3. Tipo de cambio
      const tcaRes = await transaction.request()
        .input('fecha', sql.Date, fechaStr)
        .query("SELECT TOP 1 venta FROM tbl01tca WHERE fecha = @fecha");
      const exchangeRateVal = tcaRes.recordset[0]?.venta || 3.75;

      // 4. Generar voucher contable compro
      const resMaxC = await transaction.request().query(`
        SELECT MAX(compro) as max_compro
        FROM mst01ccp
        WHERE compro LIKE '02/%'
      `);
      
      let nextVoucherNum = 1;
      const maxCompro = resMaxC.recordset[0]?.max_compro;
      if (maxCompro) {
        const vparts = maxCompro.split('/');
        const numPart = parseInt(vparts[1], 10);
        if (!isNaN(numPart)) {
          nextVoucherNum = numPart + 1;
        }
      }
      const nextCompro = `02/${nextVoucherNum.toString().padStart(6, '0')}`;

      // 5. Procesar items para calcular totales
      let headerTotalMonto = 0; 
      let headerTotalTota = 0;  
      let headerTotalToti = 0;  

      const processedItems = [];

      for (const [idx, item] of items.entries()) {
        const itemRes = await transaction.request()
          .input('codi', sql.Char(11), item.id.substring(0, 11))
          .query(`
            SELECT LTRIM(RTRIM(descr)) as descr, 
                   LTRIM(RTRIM(codf)) as codf, 
                   LTRIM(RTRIM(marc)) as marc, 
                   LTRIM(RTRIM(umed)) as umed, 
                   aigv
            FROM prd0101 WITH(nolock)
            WHERE codi = @codi
          `);

        if (itemRes.recordset.length === 0) {
          throw new Error(`El producto con código ${item.id} no existe en el catálogo maestro ERP`);
        }

        const product = itemRes.recordset[0];
        const itemQty = Number(item.quantity) || 0;
        const itemCostWithIgv = Number(item.cost) || 0;

        const isTaxable = product.aigv === 'S';
        const itemTotal = Number((itemCostWithIgv * itemQty).toFixed(2));
        const itemSubtotal = isTaxable ? Math.round((itemTotal / 1.18) * 10) / 10 : itemTotal;
        const itemTax = isTaxable ? Number((itemTotal - itemSubtotal).toFixed(2)) : 0;
        const itemNetUnitPrice = isTaxable ? Number((itemCostWithIgv / 1.18).toFixed(4)) : itemCostWithIgv;

        headerTotalMonto += itemTotal;
        headerTotalTota += itemSubtotal;
        headerTotalToti += itemTax;

        processedItems.push({
          id: item.id,
          name: product.descr || '',
          itemTotal
        });
      }

      const totalAmount = Number(headerTotalMonto.toFixed(2));
      const subtotalAmount = Number(headerTotalTota.toFixed(2));
      const taxAmount = Number(headerTotalToti.toFixed(2));

      const finalCodpro = supplier.codpro.substring(0, 6);
      const finalNompro = supplier.nompro.trim().toUpperCase().substring(0, 60);
      const finalRucpro = supplier.rucpro ? supplier.rucpro.trim().substring(0, 11) : '';

      const finalCrefe = gimNumber ? '29' : '  ';
      const finalNrefe = gimNumber ? gimNumber.substring(0, 12) : '            ';

      // 6. Insertar en Cuentas por Pagar Cabecera (mst01ccp)
      const firstItemName = processedItems[0]?.name.substring(0, 50) || 'COMPRA MERCADERIA';
      const displayGlosa = `COMPRA: ${firstItemName}`.substring(0, 100);

      const reqMstCcp = new sql.Request(transaction);
      await reqMstCcp
        .input('fecha', sql.Date, fechaStr)
        .input('cdocu', sql.Char(2), docType.substring(0, 2))
        .input('ndocu', sql.Char(12), docNumber.substring(0, 12))
        .input('crefe', sql.Char(2), finalCrefe)
        .input('nrefe', sql.Char(12), finalNrefe)
        .input('codpro', sql.Char(6), finalCodpro)
        .input('nompro', sql.VarChar(60), finalNompro)
        .input('rucpro', sql.Char(11), finalRucpro.padEnd(11, ' '))
        .input('monto', sql.Decimal(18, 2), totalAmount)
        .input('fven', sql.Date, fechaVencStr)
        .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
        .input('glosa', sql.VarChar(100), displayGlosa.padEnd(100, ' '))
        .input('compro', sql.Char(9), nextCompro.padEnd(9, ' '))
        .query(`
          INSERT INTO mst01ccp (
            fecha, cdocu, ndocu, crefe, nrefe, codpro, nompro, rucpro, 
            codcdc, monto, saldo, dias, fven, mora, uabo, tcam, 
            mone, flag, cuenta, glosa, codest, codbco, nombco, unibco, 
            agebco, fcam, fren, fpro, feco, flagi, flagp, flagc, 
            flacje, compro, selchk, marchk, FecAju, TcaOld, codsub, 
            nrope, NumPre, tiponc, persnt, imone, itcam, imonto, 
            codccp, cuentaold, codscc, codpos, Leasing, cuota, capital, 
            intdiferido, igvdiferido, comestruc, otrosgasto, totalcuota, nrodua, 
            attach, codafp, rhaporte, afpcomi, afpsegu, tipocom_afp, fecreg, 
            valref, fppag, obse_logistica, Flag_Conf_alm, prioridad, tasa
          ) VALUES (
            @fecha, @cdocu, @ndocu, @crefe, @nrefe, @codpro, @nompro, @rucpro,
            '01', @monto, @monto, 0, @fven, 0.00, NULL, @tcam,
            'S', '0', '42121     ', @glosa, '01', '  ', '', '          ',
            '          ', NULL, NULL, NULL, NULL, NULL, 0, 0,
            0, @compro, 0, ' ', @fecha, 0.0000, '  ',
            NULL, '            ', 0, 0, ' ', 0.0000, 0.00,
            '01', NULL, '          ', '             ', '            ', 0, 0.00,
            0.00, 0.00, 0.00, 0.00, 0.00, '                                                  ',
            0, '  ', 0.00, 0.00, 0.00, 0, GETDATE(),
            0.00, NULL, '', 0, 0, 0.00
          )
        `);

      // 7. Insertar en Cuentas por Pagar Detalle (dtl01ccp)
      const reqDtlCcp = new sql.Request(transaction);
      await reqDtlCcp
        .input('fecha', sql.Date, fechaStr)
        .input('codpro', sql.Char(6), finalCodpro)
        .input('cdocu', sql.Char(2), docType.substring(0, 2))
        .input('ndocu', sql.Char(12), docNumber.substring(0, 12))
        .input('glosa', sql.VarChar(100), displayGlosa.padEnd(100, ' '))
        .input('cargo', sql.Decimal(18, 2), totalAmount)
        .input('tcam', sql.Decimal(18, 4), exchangeRateVal)
        .input('compro', sql.Char(9), nextCompro.padEnd(9, ' '))
        .query(`
          INSERT INTO dtl01ccp (
            fecha, codpro, tmov, cdocu, ndocu, crefe, nrefe, glosa, 
            cargo, abono, mone, tcam, cpago, mpago, npago, ipago, 
            nplan, idunico, fecreg, compro
          ) VALUES (
            @fecha, @codpro, 'C', @cdocu, @ndocu, @cdocu, @ndocu, @glosa,
            @cargo, 0, 'S', @tcam, ' ', ' ', '            ', 0,
            '            ', NEWID(), GETDATE(), @compro
          )
        `);

      // 8. Vincular Factura en la GIM (si es referenciada)
      if (gimNumber) {
        const reqLinkGim = new sql.Request(transaction);
        await reqLinkGim
          .input('gimNumber', sql.Char(12), gimNumber.substring(0, 12))
          .input('cdocu', sql.Char(2), docType.substring(0, 2))
          .input('ndocu', sql.Char(12), docNumber.substring(0, 12))
          .query(`
            UPDATE mst01gim 
            SET crefe = @cdocu, nrefe = @ndocu 
            WHERE ndocu = @gimNumber AND cdocu = '29'

            UPDATE dtl01gim 
            SET cfac = @cdocu, nfac = @ndocu 
            WHERE ndocu = @gimNumber AND cdocu = '29'

            -- También vincular en el Kardex
            UPDATE kdd 
            SET cfac = @cdocu, nfac = @ndocu
            FROM kdd0101 kdd
            WHERE kdd.ndocu = @gimNumber AND kdd.cdocu = '29'
          `);
      }

      await transaction.commit();
      logger.info(`[PurchaseService/MSSQL] Provisión de Factura registrada con éxito. Voucher = ${nextCompro}`);

      return {
        success: true,
        voucher: nextCompro,
        docType,
        docNumber,
        total: totalAmount,
        subtotal: subtotalAmount,
        igv: taxAmount,
        supplier: {
          codpro: finalCodpro,
          nompro: finalNompro,
          rucpro: finalRucpro
        }
      };

    } catch (err) {
      logger.error(`[PurchaseService/MSSQL] ERROR al registrar Provisión de Factura: ${err.message}`);
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        logger.error(`[PurchaseService/MSSQL] Falló rollback de transacción CCP: ${rollbackErr.message}`);
      }
      throw err;
    }
  }
}

export default new NavaPurchaseService();
