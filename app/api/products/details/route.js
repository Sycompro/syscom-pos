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
    const codi = searchParams.get('codi');

    if (!codi) {
      return NextResponse.json({ error: 'El código de producto (codi) es requerido' }, { status: 400 });
    }

    const pool = await getConnection(company);

    const result = await pool.request()
      .input('codi', sql.Char(20), codi)
      .query(`
        SELECT TOP 1 
          RTRIM(codi) as codi, RTRIM(descr) as descr, RTRIM(marc) as marc, RTRIM(codmar) as codmar, 
          pvns, pcns, RTRIM(codcolor_prod) as codcolor_prod, RTRIM(talla) as talla, 
          RTRIM(codf) as codf, RTRIM(umed) as umed, tipoitm, RTRIM(msto) as msto, 
          RTRIM(aigv) as aigv, RTRIM(Usr_003) as Usr_003
        FROM prd0101 WITH(nolock)
        WHERE LTRIM(RTRIM(codi)) = LTRIM(RTRIM(@codi))
      `);

    const product = result.recordset[0];
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Extraer jerarquía desde el código de producto codi (AABB-CCDDDD)
    const codiStr = product.codi.trim();
    let familyId = '';
    let subfamilyId = '';
    let groupId = '';

    if (codiStr.length >= 7) {
      familyId = codiStr.substring(0, 2);
      subfamilyId = codiStr.substring(0, 2) + '-' + codiStr.substring(2, 4);
      groupId = codiStr.substring(0, 2) + '-' + codiStr.substring(2, 4) + '-' + codiStr.substring(5, 7);
    }

    return NextResponse.json({
      codi: product.codi,
      descr: product.descr,
      marc: product.marc,
      codmar: product.codmar,
      pvns: product.pvns,
      cost: product.pcns,
      codcolor_prod: product.codcolor_prod,
      talla: product.talla,
      codf: product.codf,
      umed: product.umed,
      tipoitm: product.tipoitm,
      msto: product.msto === 'S',
      aigv: product.aigv === 'S',
      membershipDays: parseInt(product.Usr_003 || '0', 10) || 0,
      familyId,
      subfamilyId,
      groupId
    });

  } catch (error) {
    console.error('[API Product Details] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
