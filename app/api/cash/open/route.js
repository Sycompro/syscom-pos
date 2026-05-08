import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import sql from 'mssql';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const { amount, pointOfSale = '01' } = await request.json();

        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const pool = await getConnection(session.user.company);
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

        // --- DETECCIÓN DE ESQUEMA ---
        let schemaType = 'ERP';
        try {
            await pool.request().query("SELECT TOP 0 * FROM dtl_restpos_apecaj");
        } catch (e) {
            schemaType = 'POS';
        }

        if (schemaType === 'ERP') {
            const userCode = session.user.id?.trim() || 'WEB';
            const sedeCode = session.user.sedeId?.trim() || '01';

            // --- GENERAR CORRELATIVO OFICIAL DE PLANILLA (Doc 77) ---
            const resCor = await pool.request()
                .input('cdocu', '77')
                .input('codpto', sedeCode)
                .query("SELECT nroini FROM tbl01cor WHERE cdocu = @cdocu AND codpto = @codpto");
            
            if (!resCor.recordset[0]) {
                return NextResponse.json({ error: `No se encontró correlativo de planilla (Doc 77) para la sede ${sedeCode}` }, { status: 400 });
            }

            const currentNroIni = resCor.recordset[0].nroini.trim();
            const parts = currentNroIni.split('-');
            const series = parts[0];
            const numPartOriginal = parts.length > 1 ? parts[1] : parts[0];
            const numPartClean = numPartOriginal.replace(/[^0-9]/g, '');
            const nextNum = (parseInt(numPartClean, 10) + 1).toString().padStart(numPartClean.length, '0');
            const nropla = `${series}-${nextNum}`;

            // Validar si ya hay una caja abierta
            const check = await pool.request()
                .input('codpto', sql.Char(2), sedeCode)
                .input('codusu', sql.Char(3), userCode.substring(0, 3))
                .query("SELECT idapecaj FROM dtl_restpos_apecaj WHERE estado = 0 AND LTRIM(RTRIM(codpto)) = @codpto AND LTRIM(RTRIM(codusu)) = @codusu");

            if (check.recordset.length > 0) {
                return NextResponse.json({ error: 'Tú ya tienes una caja abierta en este punto de venta' }, { status: 400 });
            }

            const transaction = new sql.Transaction(pool);
            await transaction.begin();

            try {
                // 1. ACTUALIZAR CORRELATIVO DE PLANILLA EN EL ERP
                await transaction.request()
                    .input('cdocu', '77')
                    .input('codpto', sedeCode)
                    .input('nextNro', nropla)
                    .query("UPDATE tbl01cor SET nroini = @nextNro WHERE cdocu = @cdocu AND codpto = @codpto");

                // 2. INSERTAR APERTURA DE CAJA
                const result = await transaction.request()
                    .input('fecape', sql.DateTime, now)
                    .input('codpto', sql.Char(2), sedeCode)
                    .input('codusu', sql.Char(3), userCode.substring(0, 3))
                    .input('apesol', sql.Decimal(18, 2), amount || 0)
                    .input('nropla', sql.Char(12), nropla)
                    .query(`
                        DECLARE @formattedHora VARCHAR(12) = RIGHT(CAST(YEAR(GETDATE()) AS VARCHAR), 2) + ' ' + LTRIM(RIGHT(CONVERT(VARCHAR, GETDATE(), 100), 7));
                        -- Asegurar que no haya dobles espacios
                        SET @formattedHora = REPLACE(@formattedHora, '  ', ' ');

                        INSERT INTO dtl_restpos_apecaj (fecape, hora, codpto, codusu, tmov, estado, apesol, apedol, apeeur, nropla)
                        VALUES (@fecape, @formattedHora, @codpto, @codusu, 'A', 0, @apesol, 0, 0, '            ');
                        SELECT SCOPE_IDENTITY() as id;
                    `);
                
                const newId = result.recordset[0].id;

                // 3. ACTUALIZAR TABLA MAESTRA tbl01pto (Para visibilidad en monitores ERP)
                await transaction.request()
                    .input('codpto', sql.Char(10), sedeCode) // Usamos Char mayor para cubrir cualquier padding
                    .input('idapecaj', sql.Int, newId)
                    .input('apesol', sql.Decimal(18, 2), amount || 0)
                    .input('codusu', sql.Char(3), userCode.substring(0, 3))
                    .query(`
                        UPDATE tbl01pto 
                        SET estado = 0, 
                            apecaj = @idapecaj, 
                            apecajsol = @apesol,
                            apecajusu = @codusu,
                            apecajtur = '01',
                            apecajhra = GETDATE()
                        WHERE LTRIM(RTRIM(codpto)) = LTRIM(RTRIM(@codpto))
                    `);

                await transaction.commit();
                return NextResponse.json({ success: true, id: newId, nropla });
            } catch (err) {
                await transaction.rollback();
                throw err;
            }
        } else {
            // Lógica Esquema POS (DB_GYM y similares)
            const sedeId = session.user.sedeId || 1;
            const check = await pool.request()
                .input('sedeId', sql.Int, sedeId)
                .query("SELECT CajaId FROM Caja WHERE Vigente = 1 AND SedeId = @sedeId");

            if (check.recordset.length > 0) {
                return NextResponse.json({ error: 'Ya existe una caja abierta para esta sede' }, { status: 400 });
            }

            const result = await pool.request()
                .input('fecha', sql.DateTime, now)
                .input('monto', sql.Float, amount || 0)
                .input('sedeId', sql.Int, sedeId)
                .query(`
                    INSERT INTO Caja (FechaApertura, MontoApertura, Vigente, SedeId, EstadoCajaId, Turno)
                    VALUES (@fecha, @monto, 1, @sedeId, 1, 1);
                    SELECT SCOPE_IDENTITY() as id;
                `);
            return NextResponse.json({ success: true, id: result.recordset[0].id });
        }

    } catch (err) {
        console.error('Cash open error:', err);
        return NextResponse.json({ error: 'Error al abrir caja', details: err.message }, { status: 500 });
    }
}
