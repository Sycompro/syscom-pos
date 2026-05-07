import { getPrismaClient } from '@/lib/prisma-client';
import logger from '@/lib/logger';
import { calculateTaxBreakdown } from '@/lib/erp-utils';

class NavaSaleService {
  async finalize(data, dbName) {
    const prisma = getPrismaClient(dbName);

    try {
      logger.info(`[SaleService/Prisma] Iniciando venta en ${dbName}`);

      const {
        docType, codcli, nomcli, ruccli, items, payments, 
        idApeCaj, warehouse, codven, exchangeRate,
        cashReceived, changeGiven
      } = data;

      // 1. Cálculos de impuestos
      const breakdown = calculateTaxBreakdown(items);
      const fechaStr = new Date().toISOString().split('T')[0];

      // 2. Determinar códigos de pago globales
      let globalSelPago = 1; 
      let globalCodFdp = '01'; 
      let globalCodTar = '  ';
      let isMixed = payments.length > 1;

      if (isMixed) {
          globalSelPago = 4;
          globalCodFdp = '01'; // Default a Efectivo para cabecera en mixtos
      } else if (payments.length === 1) {
          const p = payments[0];
          if (p.id !== 'EF' && p.type !== 1) {
              globalSelPago = 3; 
              globalCodFdp = (p.id === '01' || p.id === '02') ? '04' : '03';
              globalCodTar = p.id;
          }
      }

      // 3. Ejecutar todo en una TRANSACCIÓN ATÓMICA de Prisma
      const result = await prisma.$transaction(async (tx) => {
        
        // A. Obtener correlativo de tbl01cor
        const pdoc = await tx.$queryRaw`SELECT nroini FROM tbl01cor WHERE cdocu = ${docType} AND codpto = ${warehouse.substring(0, 2)}`;
        if (!pdoc || pdoc.length === 0) {
          throw new Error(`No se encontró correlativo para el documento ${docType} en la sede ${warehouse}`);
        }
        
        const currentNroIni = pdoc[0].nroini.trim(); 
        const parts = currentNroIni.split('-');
        if (parts.length < 2) {
          throw new Error(`Formato de correlativo inválido: ${currentNroIni}`);
        }

        const series = parts[0];
        const currentNum = parseInt(parts[1], 10);
        const nextNum = currentNum + 1;
        const nextNdocu = `${series}-${nextNum.toString().padStart(8, '0')}`;
        
        // PREVENCIÓN DE DUPLICADOS: Verificar si ya existe este ndocu
        const existing = await tx.mst01fac.findFirst({
          where: { cdocu: docType, ndocu: nextNdocu }
        });
        if (existing) {
          throw new Error(`CRÍTICO: El número de documento ${nextNdocu} ya existe. Por favor, reintente.`);
        }

        // Actualizar tbl01cor con el siguiente número
        await tx.$executeRaw`UPDATE tbl01cor SET nroini = ${nextNdocu} WHERE cdocu = ${docType} AND codpto = ${warehouse.substring(0, 2)}`;

        // B. Insertar Cabecera de Factura (mst01fac)
        await tx.mst01fac.create({
          data: {
            cdocu: docType,
            ndocu: nextNdocu,
            fecha: fechaStr,
            fven: fechaStr,
            codcli: (codcli || '000000').substring(0, 6),
            nomcli: (nomcli || 'CLIENTE VARIOS').substring(0, 60),
            ruccli: (ruccli || '').substring(0, 11),
            totn: breakdown.total,
            toti: breakdown.tax,
            tota: breakdown.subtotal,
            mone: 'S',
            tcam: exchangeRate || 1,
            codpto: warehouse.substring(0, 2),
            CodAlm: warehouse.substring(0, 2),
            idapecaj: idApeCaj,
            selpago: globalSelPago,
            codfdp: globalCodFdp,
            codtar: globalCodTar,
            compro: 'WEB-POS',
            codusu: 'WEB',
            flag: ' ',
            tfact: (docType === '65' ? 'N' : 'S'),
            Codcdv: '01',
            codvta: '01',
            codven: (codven || 'V0001').substring(0, 5),
            codsub: '01',
            cajrecib: cashReceived || breakdown.total,
            cajvuelto: changeGiven || 0,
            cobmixta: isMixed ? 1 : 0
          }
        });

        // C. Insertar Detalles de Factura (dtl01fac)
        for (const [idx, item] of items.entries()) {
          const itemNet = (item.price * item.quantity) / 1.18;
          const itemTotal = item.price * item.quantity;

          await tx.dtl01fac.create({
            data: {
              cdocu: docType,
              ndocu: nextNdocu,
              item: idx + 1,
              codart: item.id.substring(0, 20),
              descr: item.name.substring(0, 100),
              cant: item.quantity,
              precio: item.price,
              tota: itemNet,
              totn: itemTotal,
              CodAlm: warehouse.substring(0, 2),
              flag: ' ',
              dcto: 0,
              dscto: 0
            }
          });
        }

        // D. Cabecera de Cobro (mst01cob)
        // El ndocu de cobranza suele ser un correlativo aparte (Recibo), pero aquí usamos el mismo con prefijo R para simplificar o lo que pida el ERP
        const nroRecibo = `R${nextNdocu.substring(1)}`; 

        await tx.mst01cob.create({
          data: {
            cdocu: '38', // Tipo Recibo en Navasoft
            ndocu: nroRecibo,
            crefe: docType,
            nrefe: nextNdocu,
            fecha: fechaStr,
            tmov: 'I',
            glosa: 'VENTA POS WEB',
            codcli: (codcli || '000000').substring(0, 6),
            nomcli: (nomcli || 'CLIENTE VARIOS').substring(0, 60),
            monto: breakdown.total,
            mone: 'S',
            tcam: 1,
            flag: '0',
            codven: (codven || 'V0001').substring(0, 5),
            codpto: warehouse.substring(0, 2),
            idapecaj: idApeCaj,
            cpago: isMixed ? 'M' : ((payments[0].id === 'EF' || payments[0].type === 1) ? 'E' : 'T'),
            selpago: globalSelPago
          }
        });

        // E. Detalle de Cobro (dtl01cob)
        for (const [idx, p] of payments.entries()) {
          const cpago = (p.id === 'EF' || p.type === 1) ? 'E' : 'T';
          
          let codbco = (p.id === 'EF') ? '  ' : p.id;
          if (p.id === '01' || p.id === '02') {
              codbco = '09'; // Mapeo a Billeteras
          }

          await tx.dtl01cob.create({
            data: {
              cdocu: '38',
              ndocu: nroRecibo,
              item: idx + 1,
              crefe: docType,
              nrefe: nextNdocu,
              monto: p.amount,
              cpago: cpago,
              codbco: codbco.substring(0, 2),
              mone: 'S',
              tcam: 1,
              codven: (codven || 'V0001').substring(0, 5),
              valori: p.amount,
              monori: 'S',
              mtopad: 0,
              mtopas: p.amount,
              codn: ' ',
              impdonac: 0
            }
          });
        }

        return { success: true, ndocu: nextNdocu, total: breakdown.total };
      }, {
          timeout: 10000 // Aumentar timeout para evitar cierres prematuros en SQL Server
      });

      return result;

    } catch (err) {
      logger.error(`[SaleService/Prisma] Error: ${err.message}`);
      throw err;
    } finally {
      await prisma.$disconnect();
    }
  }
}

export default new NavaSaleService();
