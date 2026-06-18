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
    
    const todayStr = new Date().toISOString().split('T')[0];
    const startDateParam = searchParams.get('startDate') || todayStr;
    const endDateParam = searchParams.get('endDate') || todayStr;
    const sedeIdParam = searchParams.get('sedeId') || 'all'; 
    const docTypeParam = searchParams.get('docType') || 'all'; 
    const sellerIdParam = searchParams.get('sellerId') || 'all'; 
    const searchParam = (searchParams.get('search') || '').trim();

    const pool = await getConnection(company);

    const startStr = `${startDateParam} 00:00:00`;
    const endStr = `${endDateParam} 23:59:59`;

    // Construcción de condiciones WHERE dinámicas
    let queryConditions = "WHERE f.fecha >= CONVERT(DATETIME, @start, 120) AND f.fecha <= CONVERT(DATETIME, @end, 120)";
    
    if (sedeIdParam !== 'all') {
      queryConditions += " AND LTRIM(RTRIM(f.Codpto)) = @sedeId";
    }
    if (docTypeParam !== 'all') {
      queryConditions += " AND LTRIM(RTRIM(f.cdocu)) = @docType";
    }
    if (sellerIdParam !== 'all') {
      queryConditions += " AND LTRIM(RTRIM(f.codven)) = @sellerId";
    }
    if (searchParam) {
      queryConditions += " AND (f.ndocu LIKE @search OR f.nomcli LIKE @search OR f.ruccli LIKE @search)";
    }

    const salesRequest = pool.request();
    salesRequest.input('start', sql.VarChar(30), startStr);
    salesRequest.input('end', sql.VarChar(30), endStr);
    
    if (sedeIdParam !== 'all') salesRequest.input('sedeId', sql.VarChar(10), sedeIdParam.trim());
    if (docTypeParam !== 'all') salesRequest.input('docType', sql.VarChar(10), docTypeParam.trim());
    if (sellerIdParam !== 'all') salesRequest.input('sellerId', sql.VarChar(10), sellerIdParam.trim());
    if (searchParam) salesRequest.input('search', sql.VarChar(100), `%${searchParam}%`);

    const queryStr = `
      SELECT 
        f.ndocu, f.cdocu, f.nomcli, f.ruccli, 
        CAST(f.totn AS FLOAT) as tota, 
        f.fecha, f.FecReg, f.flag, f.selpago, f.codven, f.codfdp,
        CONVERT(VARCHAR(8), f.FecReg, 108) as hora_real,
        CONVERT(VARCHAR(10), f.FecReg, 103) as fecha_real,
        LTRIM(RTRIM(p.nompto)) as sedeName,
        LTRIM(RTRIM(v.nomven)) as sellerName
      FROM mst01fac f WITH(nolock)
      LEFT JOIN tbl01pto p WITH(nolock) ON LTRIM(RTRIM(p.codpto)) = LTRIM(RTRIM(f.Codpto))
      LEFT JOIN tbl01ven v WITH(nolock) ON LTRIM(RTRIM(v.codven)) = LTRIM(RTRIM(f.codven))
      ${queryConditions}
      ORDER BY f.FecReg DESC
    `;

    const salesRes = await salesRequest.query(queryStr);

    // Mapeo final de estado y tipo de pago
    const sales = salesRes.recordset.map(s => ({
      ...s,
      status: (s.flag === '9' || s.flag === '*') ? 'ANULADO' : 'ACTIVO',
      paymentType: s.selpago === 1 ? 'EFECTIVO' : (s.selpago === 4 ? 'MIXTO' : 'TARJETA')
    }));

    // Cargar sedes del ERP para el filtro
    const activeSedesRes = await pool.request().query(`
      SELECT LTRIM(RTRIM(codpto)) as codpto, LTRIM(RTRIM(nompto)) as nompto 
      FROM tbl01pto WITH(nolock)
      ORDER BY nompto ASC
    `);
    const sedes = activeSedesRes.recordset.map(r => ({
      id: r.codpto,
      name: r.nompto?.trim() || `Sede ${r.codpto}`
    }));

    // Cargar motivos de anulación reales del ERP
    const motivosRes = await pool.request().query(`
      SELECT LTRIM(RTRIM(codanu)) as codanu, LTRIM(RTRIM(detanu)) as detanu 
      FROM Tbl_motivo_anulacion WITH(nolock)
      ORDER BY codanu ASC
    `);
    const motivosAnulacion = motivosRes.recordset.map(r => ({
      id: r.codanu,
      name: r.detanu?.trim() || `Motivo ${r.codanu}`
    }));

    return NextResponse.json({
      sales,
      sedes,
      motivosAnulacion
    });

  } catch (err) {
    console.error('[API/Sales/List] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
