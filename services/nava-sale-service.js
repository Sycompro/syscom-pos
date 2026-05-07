import { getPrismaClient } from '@/lib/prisma-client';
import logger from '@/lib/logger';
import { calculateTaxBreakdown } from '@/lib/erp-utils';

class NavaSaleService {
  async finalize(data, dbName) {
    const prisma = getPrismaClient(dbName);

    try {
      logger.info(`[SaleService/Prisma] Iniciando venta optimizada en ${dbName}`);

      const {
        docType, codcli, nomcli, ruccli, items, payments, 
        idApeCaj, warehouse, codven, exchangeRate,
        cashReceived, changeGiven
      } = data;

      // 1. Cálculos de impuestos y códigos (FUERA DE LA TRANSACCIÓN para ahorrar tiempo)
      const breakdown = calculateTaxBreakdown(items);
      const fechaStr = new Date().toISOString().split('T')[0];

      let globalSelPago = 1; 
      let globalCodFdp = '01'; 
      let globalCodTar = '  ';
      let isMixed = payments.length > 1;

      if (isMixed) {
          globalSelPago = 4;
          globalCodFdp = '01';
      } else if (payments.length === 1) {
          const p = payments[0];
          if (p.id !== 'EF' && p.type !== 1) {
              globalSelPago = 3; 
              globalCodFdp = (p.id === '01' || p.id === '02') ? '04' : '03';
              globalCodTar = p.id;
          }
      }

      // Pre-preparar los arrays para createMany
      const dtlFacData = items.map((item, idx) => ({
        cdocu: docType,
        item: idx + 1,
        codart: item.id.substring(0, 20),
        descr: item.name.substring(0, 100),
        cant: item.quantity,
        precio: item.price,
        tota: (item.price * item.quantity) / 1.18,
        totn: item.price * item.quantity,
        CodAlm: warehouse.substring(0, 2),
        flag: ' ',
        dcto: 0,
        dscto: 0
      }));

      // 2. EJECUCIÓN ATÓMICA ULTRA-RÁPIDA
      const result = await prisma.$transaction(async (tx) => {
        
        // A. Gestión de Correlativo (Lo más rápido posible)
        const pdoc = await tx.$queryRaw`SELECT nroini FROM tbl01cor WHERE cdocu = ${docType} AND codpto = ${warehouse.substring(0, 2)}`;
        if (!pdoc || pdoc.length === 0) throw new Error(`Sin correlativo para ${docType}`);
        
        const currentNroIni = pdoc[0].nroini.trim(); 
        const parts = currentNroIni.split('-');
        const series = parts[0];
        const nextNum = parseInt(parts[1], 10) + 1;
        const nextNdocu = `${series}-${nextNum.toString().padStart(8, '0')}`;
        
        // Validación de duplicado interna
        const existing = await tx.mst01fac.findFirst({ where: { cdocu: docType, ndocu: nextNdocu }, select: { ndocu: true } });
        if (existing) throw new Error(`Número ${nextNdocu} ya existe.`);

        // Actualizar correlativo e insertar cabecera
        await tx.$executeRaw`UPDATE tbl01cor SET nroini = ${nextNdocu} WHERE cdocu = ${docType} AND codpto = ${warehouse.substring(0, 2)}`;

        await tx.mst01fac.create({
          data: {
            cdocu: docType, ndocu: nextNdocu, fecha: fechaStr, fven: fechaStr,
            codcli: (codcli || '000000').substring(0, 6),
            nomcli: (nomcli || 'CLIENTE VARIOS').substring(0, 60),
            ruccli: (ruccli || '').substring(0, 11),
            totn: breakdown.total, toti: breakdown.tax, tota: breakdown.subtotal,
            mone: 'S', tcam: exchangeRate || 1, codpto: warehouse.substring(0, 2),
            CodAlm: warehouse.substring(0, 2), idapecaj: idApeCaj,
            selpago: globalSelPago, codfdp: globalCodFdp, codtar: globalCodTar,
            compro: 'WEB-POS', codusu: 'WEB', flag: ' ', tfact: (docType === '65' ? 'N' : 'S'),
            Codcdv: '01', codvta: '01', codven: (codven || 'V0001').substring(0, 5), codsub: '01',
            cajrecib: cashReceived || breakdown.total, cajvuelto: changeGiven || 0, cobmixta: isMixed ? 1 : 0
          }
        });

        // B. Inserción Masiva de Detalles (1 solo comando)
        await tx.dtl01fac.createMany({
          data: dtlFacData.map(d => ({ ...d, ndocu: nextNdocu }))
        });

        // C. Cobranza (Cabecera y Detalle Masivo)
        const nroRecibo = `R${nextNdocu.substring(1)}`; 
        await tx.mst01cob.create({
          data: {
            cdocu: '38', ndocu: nroRecibo, crefe: docType, nrefe: nextNdocu,
            fecha: fechaStr, tmov: 'I', glosa: 'VENTA POS WEB',
            codcli: (codcli || '000000').substring(0, 6),
            nomcli: (nomcli || 'CLIENTE VARIOS').substring(0, 60),
            monto: breakdown.total, mone: 'S', tcam: 1, flag: '0',
            codven: (codven || 'V0001').substring(0, 5),
            codpto: warehouse.substring(0, 2), idapecaj: idApeCaj,
            cpago: isMixed ? 'M' : ((payments[0].id === 'EF' || payments[0].type === 1) ? 'E' : 'T'),
            selpago: globalSelPago
          }
        });

        const dtlCobData = payments.map((p, idx) => {
            let codbco = (p.id === 'EF') ? '  ' : p.id;
            if (p.id === '01' || p.id === '02') codbco = '09';
            return {
                cdocu: '38', ndocu: nroRecibo, item: idx + 1,
                crefe: docType, nrefe: nextNdocu, monto: p.amount,
                cpago: (p.id === 'EF' || p.type === 1) ? 'E' : 'T',
                codbco: codbco.substring(0, 2), mone: 'S', tcam: 1,
                codven: (codven || 'V0001').substring(0, 5), valori: p.amount,
                monori: 'S', mtopad: 0, mtopas: p.amount, codn: ' ', impdonac: 0
            };
        });

        await tx.dtl01cob.createMany({ data: dtlCobData });

        return { success: true, ndocu: nextNdocu, total: breakdown.total };
      }, {
          timeout: 15000 // 15s de margen para la transacción completa
      });

      return result;

    } catch (err) {
      logger.error(`[SaleService/Prisma] Error: ${err.message}`);
      throw err;
    }
  }
}

export default new NavaSaleService();
