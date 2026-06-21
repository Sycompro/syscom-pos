import { getConnection } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import sql from 'mssql';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const company = session.user.company;
    const { searchParams } = new URL(request.url);
    
    // Obtener fecha actual en hora de Perú (UTC-5)
    const getPeruDateStr = () => {
      const d = new Date();
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const peruTime = new Date(utc + (3600000 * -5));
      const year = peruTime.getFullYear();
      const month = String(peruTime.getMonth() + 1).padStart(2, '0');
      const day = String(peruTime.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = getPeruDateStr();
    const startDateParam = searchParams.get('startDate') || todayStr;
    const endDateParam = searchParams.get('endDate') || todayStr;
    const sedeIdParam = searchParams.get('sedeId') || 'all'; // 'all' o codpto específico (ej: '09')
    const sellerIdParam = searchParams.get('sellerId') || 'all'; // 'all' o codven específico
    const docTypeParam = searchParams.get('docType') || 'all'; // 'all', '01', '03', '65'
    const paymentMethodParam = searchParams.get('paymentMethod') || 'all'; // 'all', 'EF', o código de tarjeta (ej: '04')

    const pool = await getConnection(company);

    // Formatear las fechas de inicio y fin de forma segura
    const start = new Date(startDateParam + 'T00:00:00');
    const end = new Date(endDateParam + 'T23:59:59');

    // Construcción de condiciones WHERE dinámicas basadas en los filtros seleccionados
    let filtersCondition = "";
    if (sedeIdParam !== 'all') {
      filtersCondition += " AND LTRIM(RTRIM(f.Codpto)) = @sedeId";
    }
    if (sellerIdParam !== 'all') {
      filtersCondition += " AND LTRIM(RTRIM(f.codven)) = @sellerId";
    }
    if (docTypeParam !== 'all') {
      filtersCondition += " AND LTRIM(RTRIM(f.cdocu)) = @docType";
    }
    if (paymentMethodParam !== 'all') {
      if (paymentMethodParam === 'EF') {
        filtersCondition += " AND (f.selpago = 1 OR EXISTS (SELECT 1 FROM dtl_restpos_cobmixta m WITH(nolock) WHERE m.cdocu = f.cdocu AND m.ndocu = f.ndocu AND LTRIM(RTRIM(m.codtar)) = 'NS'))";
      } else {
        filtersCondition += " AND (LTRIM(RTRIM(f.codtar)) = @paymentMethod OR EXISTS (SELECT 1 FROM dtl_restpos_cobmixta m WITH(nolock) WHERE m.cdocu = f.cdocu AND m.ndocu = f.ndocu AND LTRIM(RTRIM(m.codtar)) = @paymentMethod))";
      }
    }

    // Helper para asociar los inputs a la petición SQL
    const appendFilterInputs = (req) => {
      req.input('start', sql.DateTime, start);
      req.input('end', sql.DateTime, end);
      if (sedeIdParam !== 'all') req.input('sedeId', sql.VarChar(10), sedeIdParam.trim());
      if (sellerIdParam !== 'all') req.input('sellerId', sql.VarChar(10), sellerIdParam.trim());
      if (docTypeParam !== 'all') req.input('docType', sql.VarChar(10), docTypeParam.trim());
      if (paymentMethodParam !== 'all') req.input('paymentMethod', sql.VarChar(10), paymentMethodParam.trim());
    };

    // Helper para crear un request con filtros ya configurados
    const createRequest = () => {
      const req = pool.request();
      req.timeout = 60000; // 60 segundos de timeout por consulta
      appendFilterInputs(req);
      return req;
    };

    // Helper para ejecutar consulta con identificación de errores
    const runQuery = async (name, queryFn) => {
      try {
        return await queryFn();
      } catch (err) {
        console.error(`[Dashboard] Error en consulta "${name}":`, err?.message);
        throw new Error(`Fallo en consulta "${name}": ${err?.message}`);
      }
    };

    // Determinar tipo de agrupación temporal
    const isSingleDay = startDateParam === endDateParam;
    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));

    let timeQuery = "";
    if (isSingleDay) {
      timeQuery = `
        SELECT 
          DATEPART(HOUR, f.FecReg) as hourLabel,
          COUNT(*) as quantity,
          ISNULL(SUM(f.totn), 0) as totalAmount
        FROM mst01fac f WITH(nolock)
        WHERE f.fecha >= @start AND f.fecha <= @end
          AND f.flag = '0'
          ${filtersCondition}
        GROUP BY DATEPART(HOUR, f.FecReg)
        ORDER BY hourLabel ASC
      `;
    } else if (diffDays > 31) {
      timeQuery = `
        SELECT 
          CONCAT(CAST(YEAR(f.fecha) AS VARCHAR), '-', RIGHT('0' + CAST(MONTH(f.fecha) AS VARCHAR), 2)) as monthLabel,
          COUNT(*) as quantity,
          ISNULL(SUM(f.totn), 0) as totalAmount
        FROM mst01fac f WITH(nolock)
        WHERE f.fecha >= @start AND f.fecha <= @end
          AND f.flag = '0'
          ${filtersCondition}
        GROUP BY YEAR(f.fecha), MONTH(f.fecha)
        ORDER BY monthLabel ASC
      `;
    } else {
      timeQuery = `
        SELECT 
          CAST(f.fecha as DATE) as dateLabel,
          COUNT(*) as quantity,
          ISNULL(SUM(f.totn), 0) as totalAmount
        FROM mst01fac f WITH(nolock)
        WHERE f.fecha >= @start AND f.fecha <= @end
          AND f.flag = '0'
          ${filtersCondition}
        GROUP BY CAST(f.fecha as DATE)
        ORDER BY dateLabel ASC
      `;
    }

    // --- EJECUTAR TODAS LAS CONSULTAS EN PARALELO ---
    const [
      kpiRes,
      docRes,
      sellerRes,
      timeRes,
      sedeRes,
      activeSedesRes,
      weekdayRes,
      dispersionRes,
      paretoRes
    ] = await Promise.all([
      // CONSULTA 1: KPIs PRINCIPALES
      runQuery('KPIs', () => createRequest().query(`
        SELECT 
          ISNULL(SUM(CASE WHEN f.flag = '0' THEN f.totn ELSE 0 END), 0) as totalRevenue,
          COUNT(CASE WHEN f.flag = '0' THEN 1 END) as totalTransactions,
          ISNULL(SUM(CASE WHEN f.flag = '*' THEN f.totn ELSE 0 END), 0) as totalCanceledRevenue,
          COUNT(CASE WHEN f.flag = '*' THEN 1 END) as totalCanceledTransactions
        FROM mst01fac f WITH(nolock)
        WHERE f.fecha >= @start AND f.fecha <= @end
          ${filtersCondition}
      `)),

      // CONSULTA 2: VENTAS POR TIPO DE COMPROBANTE
      runQuery('DocumentTypes', () => createRequest().query(`
        SELECT 
          LTRIM(RTRIM(f.cdocu)) as cdocu,
          COUNT(*) as quantity,
          ISNULL(SUM(f.totn), 0) as totalAmount
        FROM mst01fac f WITH(nolock)
        WHERE f.fecha >= @start AND f.fecha <= @end
          AND f.flag = '0'
          ${filtersCondition}
        GROUP BY f.cdocu
      `)),

      // CONSULTA 3: RANKING DE VENDEDORES (Top 5)
      runQuery('SellersRanking', () => createRequest().query(`
        SELECT TOP 5
          LTRIM(RTRIM(f.codven)) as codven,
          LTRIM(RTRIM(v.nomven)) as sellerName,
          COUNT(*) as quantity,
          ISNULL(SUM(f.totn), 0) as totalAmount
        FROM mst01fac f WITH(nolock)
        LEFT JOIN tbl01ven v WITH(nolock) ON LTRIM(RTRIM(v.codven)) = LTRIM(RTRIM(f.codven))
        WHERE f.fecha >= @start AND f.fecha <= @end
          AND f.flag = '0'
          ${filtersCondition}
        GROUP BY f.codven, v.nomven
        ORDER BY totalAmount DESC
      `)),

      // CONSULTA 4: EVOLUCIÓN TEMPORAL
      runQuery('TimeEvolution', () => createRequest().query(timeQuery)),

      // CONSULTA 5: DISTRIBUCIÓN POR SEDE (Solo si es consolidado)
      sedeIdParam === 'all'
        ? runQuery('SalesBySede', () => createRequest().query(`
            SELECT 
              LTRIM(RTRIM(f.Codpto)) as sedeId,
              LTRIM(RTRIM(p.nompto)) as sedeName,
              COUNT(*) as quantity,
              ISNULL(SUM(f.totn), 0) as totalAmount
            FROM mst01fac f WITH(nolock)
            LEFT JOIN tbl01pto p WITH(nolock) ON LTRIM(RTRIM(p.codpto)) = LTRIM(RTRIM(f.Codpto))
            WHERE f.fecha >= @start AND f.fecha <= @end
              AND f.flag = '0'
              ${filtersCondition}
            GROUP BY f.Codpto, p.nompto
            ORDER BY totalAmount DESC
          `))
        : Promise.resolve({ recordset: [] }),

      // CONSULTA 6: LISTADO DE SEDES ACTIVAS
      runQuery('ActiveSedes', () => pool.request().query(`
        SELECT LTRIM(RTRIM(codpto)) as codpto, LTRIM(RTRIM(nompto)) as nompto 
        FROM tbl01pto WITH(nolock)
      `)),

      // CONSULTA 7: RENDIMIENTO POR DÍA DE LA SEMANA
      runQuery('WeekdayDistribution', () => createRequest().query(`
        SELECT 
          ((DATEPART(dw, CAST(f.fecha AS DATE)) + @@DATEFIRST - 2) % 7) + 1 as weekdayNum,
          COUNT(*) as quantity,
          ISNULL(SUM(f.totn), 0) as totalAmount
        FROM mst01fac f WITH(nolock)
        WHERE f.fecha >= @start AND f.fecha <= @end
          AND f.flag = '0'
          ${filtersCondition}
        GROUP BY ((DATEPART(dw, CAST(f.fecha AS DATE)) + @@DATEFIRST - 2) % 7) + 1
        ORDER BY weekdayNum ASC
      `)),

      // CONSULTA 8: ESTADÍSTICAS DE DISPERSIÓN Y TICKET
      runQuery('Dispersion', () => createRequest().query(`
        SELECT 
          ISNULL(STDEV(f.totn), 0) as stdDev,
          ISNULL(MAX(f.totn), 0) as maxTicket,
          ISNULL(MIN(f.totn), 0) as minTicket
        FROM mst01fac f WITH(nolock)
        WHERE f.fecha >= @start AND f.fecha <= @end
          AND f.flag = '0'
          ${filtersCondition}
      `)),

      // CONSULTA 9: ANÁLISIS DE PARETO DE ARTÍCULOS
      runQuery('ParetoProducts', () => createRequest().query(`
        SELECT TOP 10
          LTRIM(RTRIM(d.codi)) as codart,
          LTRIM(RTRIM(d.descr)) as name,
          SUM(d.cant) as quantity,
          ISNULL(SUM(d.totn), 0) as totalAmount
        FROM dtl01fac d WITH(nolock)
        INNER JOIN mst01fac f WITH(nolock) ON f.cdocu = d.cdocu AND f.ndocu = d.ndocu
        WHERE f.fecha >= @start AND f.fecha <= @end
          AND f.flag = '0' AND d.flag = '0'
          ${filtersCondition}
        GROUP BY d.codi, d.descr
        ORDER BY totalAmount DESC
      `))
    ]);

    // --- PROCESAR RESULTADOS ---
    const kpis = kpiRes.recordset[0];
    const totalRevenue = kpis.totalRevenue;
    const totalTransactions = kpis.totalTransactions;
    const averageTicket = totalTransactions > 0 ? (totalRevenue / totalTransactions) : 0;

    // Mapear cdocu a nombres legibles
    const docTypesMap = {
      '65': 'Nota de Venta',
      '03': 'Boleta',
      '01': 'Factura'
    };

    const documentTypes = docRes.recordset.map(r => ({
      code: r.cdocu,
      name: docTypesMap[r.cdocu] || `Otro (${r.cdocu})`,
      quantity: r.quantity,
      amount: r.totalAmount
    }));

    const sellersRanking = sellerRes.recordset.map(r => ({
      code: r.codven,
      name: r.sellerName?.trim() || `Vendedor ${r.codven}`,
      quantity: r.quantity,
      amount: r.totalAmount
    }));

    const timeEvolution = timeRes.recordset.map(r => {
      let label = "";
      if (isSingleDay) {
        label = `${r.hourLabel.toString().padStart(2, '0')}:00`;
      } else if (diffDays > 31) {
        label = r.monthLabel;
      } else {
        const d = new Date(r.dateLabel);
        label = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      }
      return {
        label,
        quantity: r.quantity,
        amount: r.totalAmount
      };
    });

    const salesBySede = sedeRes.recordset.map(r => ({
      sedeId: r.sedeId,
      name: r.sedeName?.trim() || `Sede ${r.sedeId}`,
      quantity: r.quantity,
      amount: r.totalAmount
    }));

    const activeSedes = activeSedesRes.recordset.map(r => ({
      id: r.codpto,
      name: r.nompto?.trim() || `Sede ${r.codpto}`
    }));

    const weekdayMap = {
      1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
    };
    const weekdayDistribution = weekdayRes.recordset.map(r => ({
      dayNum: r.weekdayNum,
      dayName: weekdayMap[r.weekdayNum] || `Día ${r.weekdayNum}`,
      quantity: r.quantity,
      amount: r.totalAmount
    }));

    const dispData = dispersionRes.recordset[0];
    const dispersion = {
      stdDev: dispData.stdDev || 0,
      maxTicket: dispData.maxTicket || 0,
      minTicket: dispData.minTicket || 0
    };

    const paretoProducts = paretoRes.recordset.map(r => ({
      code: r.codart,
      name: r.name?.trim() || `Artículo ${r.codart}`,
      quantity: r.quantity,
      amount: r.totalAmount
    }));

    return NextResponse.json({
      success: true,
      filters: {
        startDate: startDateParam,
        endDate: endDateParam,
        sedeId: sedeIdParam,
        sellerId: sellerIdParam,
        docType: docTypeParam,
        paymentMethod: paymentMethodParam
      },
      kpis: {
        totalRevenue,
        totalTransactions,
        averageTicket,
        canceledRevenue: kpis.totalCanceledRevenue,
        canceledTransactions: kpis.totalCanceledTransactions
      },
      documentTypes,
      sellersRanking,
      timeEvolution,
      salesBySede,
      sedes: activeSedes,
      performanceStats: {
        weekdayDistribution,
        dispersion,
        paretoProducts
      }
    });

  } catch (error) {
    console.error('[API Sales Dashboard] Error:', error?.message, error?.stack);
    return NextResponse.json({ error: error.message, detail: error?.stack?.split('\n')?.[0] }, { status: 500 });
  }
}
