import { getConnection } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const company = session.user.company;
    const pool = await getConnection(company);

    // 1. Obtener Familias
    const famsRes = await pool.request().query(`
      SELECT LTRIM(RTRIM(codfam)) as id, LTRIM(RTRIM(nomfam)) as name 
      FROM tbl01fam WITH(nolock) 
      ORDER BY nomfam ASC
    `);

    // 2. Obtener Subfamilias
    const subfamsRes = await pool.request().query(`
      SELECT LTRIM(RTRIM(codsub)) as id, LTRIM(RTRIM(nomsub)) as name, LTRIM(RTRIM(codfam)) as familyId 
      FROM tbl01sbf WITH(nolock) 
      ORDER BY nomsub ASC
    `);

    // 3. Obtener Grupos
    const groupsRes = await pool.request().query(`
      SELECT LTRIM(RTRIM(g.codgru)) as id, LTRIM(RTRIM(g.nomgru)) as name, LTRIM(RTRIM(g.codsub)) as subfamilyId, LTRIM(RTRIM(s.codfam)) as familyId 
      FROM tbl01grp g WITH(nolock)
      LEFT JOIN tbl01sbf s WITH(nolock) ON g.codsub = s.codsub
      ORDER BY g.nomgru ASC
    `);

    // 4. Obtener Marcas
    const marcasRes = await pool.request().query(`
      SELECT LTRIM(RTRIM(codmar)) as id, LTRIM(RTRIM(Nommar)) as name 
      FROM tbl01mar WITH(nolock) 
      ORDER BY Nommar ASC
    `);

    // 5. Obtener Tallas
    const tallasRes = await pool.request().query(`
      SELECT LTRIM(RTRIM(codtalla)) as id, LTRIM(RTRIM(talla)) as name 
      FROM tbl_talla WITH(nolock) 
      ORDER BY talla ASC
    `);

    // 6. Obtener Colores
    const coloresRes = await pool.request().query(`
      SELECT LTRIM(RTRIM(codcol)) as id, LTRIM(RTRIM(nomcol)) as name 
      FROM tbl_color WITH(nolock) 
      ORDER BY nomcol ASC
    `);

    return NextResponse.json({
      families: famsRes.recordset,
      subfamilies: subfamsRes.recordset,
      groups: groupsRes.recordset,
      brands: marcasRes.recordset,
      sizes: tallasRes.recordset,
      colors: coloresRes.recordset
    });

  } catch (err) {
    console.error('[API Products Metadata] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
