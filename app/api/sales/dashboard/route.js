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

    const pool = await getConnection(company);

    // Formatear las fechas de inicio y fin de forma segura
    const start = new Date(startDateParam + 'T00:00:00');
    const end = new Date(endDateParam + 'T23:59:59');

    // Construcción de condiciones WHERE basadas en el filtro de sede
    let sedeCondition = "";
    if (sedeIdParam !== 'all') {
      sedeCondition = "AND LTRIM(RTRIM(f.Codpto)) = @sedeId";
    }

    // --- CONSULTA 1: KPIs PRINCIPALES ---
    const kpiRequest = pool.request();
    kpiRequest.input('start', sql.DateTime, start);
    kpiRequest.input('end', sql.DateTime, end);
    if (sedeIdParam !== 'all') kpiRequest.input('sedeId', sql.VarChar(10), sedeIdParam.trim());

    const kpiRes = await kpiRequest.query(`
      SELECT 
        -- Ventas vigentes (flag = '0')
        ISNULL(SUM(CASE WHEN f.flag = '0' THEN f.totn ELSE 0 END), 0) as totalRevenue,
        COUNT(CASE WHEN f.flag = '0' THEN 1 END) as totalTransactions,
        
        -- Ventas anuladas (flag = '*')
        ISNULL(SUM(CASE WHEN f.flag = '*' THEN f.totn ELSE 0 END), 0) as totalCanceledRevenue,
        COUNT(CASE WHEN f.flag = '*' THEN 1 END) as totalCanceledTransactions
      FROM mst01fac f WITH(nolock)
      WHERE f.fecha >= @start AND f.fecha <= @end
        ${sedeCondition}
    `);

    const kpis = kpiRes.recordset[0];
    const totalRevenue = kpis.totalRevenue;
    const totalTransactions = kpis.totalTransactions;
    const averageTicket = totalTransactions > 0 ? (totalRevenue / totalTransactions) : 0;

    // --- CONSULTA 2: VENTAS POR TIPO DE COMPROBANTE ---
    const docRequest = pool.request();
    docRequest.input('start', sql.DateTime, start);
    docRequest.input('end', sql.DateTime, end);
    if (sedeIdParam !== 'all') docRequest.input('sedeId', sql.VarChar(10), sedeIdParam.trim());

    const docRes = await docRequest.query(`
      SELECT 
        LTRIM(RTRIM(f.cdocu)) as cdocu,
        COUNT(*) as quantity,
        ISNULL(SUM(f.totn), 0) as totalAmount
      FROM mst01fac f WITH(nolock)
      WHERE f.fecha >= @start AND f.fecha <= @end
        AND f.flag = '0'
        ${sedeCondition}
      GROUP BY f.cdocu
    `);

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

    // --- CONSULTA 3: RANKING DE VENDEDORES (Top 5) ---
    const sellerRequest = pool.request();
    sellerRequest.input('start', sql.DateTime, start);
    sellerRequest.input('end', sql.DateTime, end);
    if (sedeIdParam !== 'all') sellerRequest.input('sedeId', sql.VarChar(10), sedeIdParam.trim());

    const sellerRes = await sellerRequest.query(`
      SELECT TOP 5
        LTRIM(RTRIM(f.codven)) as codven,
        LTRIM(RTRIM(v.nomven)) as sellerName,
        COUNT(*) as quantity,
        ISNULL(SUM(f.totn), 0) as totalAmount
      FROM mst01fac f WITH(nolock)
      LEFT JOIN tbl01ven v WITH(nolock) ON LTRIM(RTRIM(v.codven)) = LTRIM(RTRIM(f.codven))
      WHERE f.fecha >= @start AND f.fecha <= @end
        AND f.flag = '0'
        ${sedeCondition}
      GROUP BY f.codven, v.nomven
      ORDER BY totalAmount DESC
    `);

    const sellersRanking = sellerRes.recordset.map(r => ({
      code: r.codven,
      name: r.sellerName?.trim() || `Vendedor ${r.codven}`,
      quantity: r.quantity,
      amount: r.totalAmount
    }));

    // --- CONSULTA 4: EVOLUCIÓN TEMPORAL ---
    const timeRequest = pool.request();
    timeRequest.input('start', sql.DateTime, start);
    timeRequest.input('end', sql.DateTime, end);
    if (sedeIdParam !== 'all') timeRequest.input('sedeId', sql.VarChar(10), sedeIdParam.trim());

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
          ${sedeCondition}
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
          ${sedeCondition}
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
          ${sedeCondition}
        GROUP BY CAST(f.fecha as DATE)
        ORDER BY dateLabel ASC
      `;
    }

    const timeRes = await timeRequest.query(timeQuery);
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

    // --- CONSULTA 5: DISTRIBUCIÓN POR SEDE (Si es consolidado) ---
    let salesBySede = [];
    if (sedeIdParam === 'all') {
      const sedeRequest = pool.request();
      sedeRequest.input('start', sql.DateTime, start);
      sedeRequest.input('end', sql.DateTime, end);
      
      const sedeRes = await sedeRequest.query(`
        SELECT 
          LTRIM(RTRIM(f.Codpto)) as sedeId,
          LTRIM(RTRIM(p.nompto)) as sedeName,
          COUNT(*) as quantity,
          ISNULL(SUM(f.totn), 0) as totalAmount
        FROM mst01fac f WITH(nolock)
        LEFT JOIN tbl01pto p WITH(nolock) ON LTRIM(RTRIM(p.codpto)) = LTRIM(RTRIM(f.Codpto))
        WHERE f.fecha >= @start AND f.fecha <= @end
          AND f.flag = '0'
        GROUP BY f.Codpto, p.nompto
        ORDER BY totalAmount DESC
      `);

      salesBySede = sedeRes.recordset.map(r => ({
        sedeId: r.sedeId,
        name: r.sedeName?.trim() || `Sede ${r.sedeId}`,
        quantity: r.quantity,
        amount: r.totalAmount
      }));
    }

    // --- CONSULTA 6: LISTADO DE SEDES ACTIVAS (Para poblar el filtro del frontend) ---
    const activeSedesRes = await pool.request().query(`
      SELECT LTRIM(RTRIM(codpto)) as codpto, LTRIM(RTRIM(nompto)) as nompto 
      FROM tbl01pto WITH(nolock)
      WHERE estado = 1
    `);
    const activeSedes = activeSedesRes.recordset.map(r => ({
      id: r.codpto,
      name: r.nompto?.trim() || `Sede ${r.codpto}`
    }));

    return NextResponse.json({
      success: true,
      filters: {
        startDate: startDateParam,
        endDate: endDateParam,
        sedeId: sedeIdParam
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
      sedes: activeSedes
    });

  } catch (error) {
    console.error('[API Sales Dashboard] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
