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
    const { type, name, familyId, subfamilyId } = body;

    if (!type || !name) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (type, name)' }, { status: 400 });
    }

    const cleanName = name.trim().toUpperCase();
    if (cleanName.length === 0) {
      return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });
    }

    const pool = await getConnection(company);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      let generatedId = '';

      if (type === 'brand') {
        // 1. Crear Marca (tbl01mar)
        const maxRes = await transaction.request().query(`
          SELECT MAX(codmar) as maxVal 
          FROM tbl01mar WITH(nolock)
        `);
        let maxVal = (maxRes.recordset[0]?.maxVal || '').trim();
        
        if (!maxVal) {
          generatedId = '0001';
        } else {
          const nextInt = parseInt(maxVal) + 1;
          generatedId = nextInt.toString().padStart(4, '0');
        }

        const abrmar = cleanName.replace(/\s+/g, '').substring(0, 5).padEnd(5, ' ');
        const insertBrand = transaction.request();
        insertBrand.input('codmar', sql.Char(4), generatedId);
        insertBrand.input('nommar', sql.Char(20), cleanName.substring(0, 20).padEnd(20, ' '));
        insertBrand.input('abrmar', sql.Char(5), abrmar);

        await insertBrand.query(`
          INSERT INTO tbl01mar (
            codmar, Nommar, abrmar, mgmin, itmmar, fvp, fvl, tele, 
            mostrador, junior, p15, p30, p45, p60, p75, p90, pmay90, cuota_vta
          ) VALUES (
            @codmar, @nommar, @abrmar, 0, 0, 0, 0, 0, 
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0
          )
        `);

      } else if (type === 'family') {
        // 2. Crear Familia (tbl01fam)
        const maxRes = await transaction.request().query(`
          SELECT MAX(codfam) as maxVal 
          FROM tbl01fam WITH(nolock)
        `);
        let maxVal = (maxRes.recordset[0]?.maxVal || '').trim();

        if (!maxVal) {
          generatedId = '01';
        } else {
          const nextInt = parseInt(maxVal) + 1;
          generatedId = nextInt.toString().padStart(2, '0');
        }

        const insertFam = transaction.request();
        insertFam.input('codfam', sql.Char(2), generatedId);
        insertFam.input('nomfam', sql.Char(40), cleanName.substring(0, 40).padEnd(40, ' '));

        await insertFam.query(`
          INSERT INTO tbl01fam (
            codfam, nomfam, cuota_compra, cuota_venta, mgmin, restpos, icono
          ) VALUES (
            @codfam, @nomfam, 0, 0, 0, 0, ''
          )
        `);

      } else if (type === 'subfamily') {
        // 3. Crear Subfamilia (tbl01sbf)
        if (!familyId) {
          throw new Error('Falta familyId para crear subfamilia');
        }

        const maxRes = await transaction.request()
          .input('familyId', sql.Char(2), familyId)
          .query(`
            SELECT MAX(codsub) as maxVal 
            FROM tbl01sbf WITH(nolock) 
            WHERE codfam = @familyId
          `);
        let maxVal = (maxRes.recordset[0]?.maxVal || '').trim();

        if (!maxVal) {
          generatedId = `${familyId}-01`;
        } else {
          const parts = maxVal.split('-');
          const nextSec = parseInt(parts[1]) + 1;
          generatedId = `${familyId}-${nextSec.toString().padStart(2, '0')}`;
        }

        const insertSub = transaction.request();
        insertSub.input('codsub', sql.Char(5), generatedId);
        insertSub.input('nomsub', sql.Char(40), cleanName.substring(0, 40).padEnd(40, ' '));
        insertSub.input('codfam', sql.Char(2), familyId);

        await insertSub.query(`
          INSERT INTO tbl01sbf (
            codsub, nomsub, codfam, ctacom, ctavta, ctavtavi, FlagCrm, 
            cuota_compra, cuota_venta, ctacomext, debcosvta, habcosvta, mgmin, restpos, icono
          ) VALUES (
            @codsub, @nomsub, @codfam, '60111       ', '70111       ', '70111       ', 0, 
            0, 0, '            ', '            ', '            ', 0, 0, ''
          )
        `);

      } else if (type === 'group') {
        // 4. Crear Grupo (tbl01grp)
        if (!subfamilyId || !familyId) {
          throw new Error('Faltan familyId o subfamilyId para crear grupo');
        }

        const maxRes = await transaction.request()
          .input('subfamilyId', sql.Char(5), subfamilyId)
          .query(`
            SELECT MAX(codgru) as maxVal 
            FROM tbl01grp WITH(nolock) 
            WHERE codsub = @subfamilyId
          `);
        let maxVal = (maxRes.recordset[0]?.maxVal || '').trim();

        if (!maxVal) {
          generatedId = `${subfamilyId}-01`;
        } else {
          const parts = maxVal.split('-');
          const nextSec = parseInt(parts[2]) + 1;
          generatedId = `${subfamilyId}-${nextSec.toString().padStart(2, '0')}`;
        }

        const insertGrp = transaction.request();
        insertGrp.input('codgru', sql.Char(8), generatedId);
        insertGrp.input('nomgru', sql.Char(40), cleanName.substring(0, 40).padEnd(40, ' '));
        insertGrp.input('codsub', sql.Char(5), subfamilyId);

        await insertGrp.query(`
          INSERT INTO tbl01grp (
            codgru, nomgru, codsub, ctacom, ctavta, ctavtavi, FlagCrm, 
            cuota_compra, cuota_venta, ctacomext, mgmin, restpos, icono
          ) VALUES (
            @codgru, @nomgru, @codsub, '60111       ', '70111       ', '70111       ', 0, 
            0, 0, '            ', 0, 0, ''
          )
        `);
      } else {
        throw new Error('Tipo de categoría no soportado');
      }

      await transaction.commit();

      console.log(`[API Create Category] Creado exitosamente: ${type} -> ${generatedId} (${cleanName})`);
      return NextResponse.json({
        success: true,
        id: generatedId,
        name: cleanName
      });

    } catch (err) {
      await transaction.rollback();
      throw err;
    }

  } catch (error) {
    console.error('[API Create Category] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
