import { NextResponse } from 'next/server';
import sql from 'mssql';
import { getConnection } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
    try {
        const body = await request.json();
        const { concepto, monto, idapecaj, codpto, codmotivo, nroctacte } = body;

        if (!concepto || !monto || !idapecaj) {
            return NextResponse.json({ success: false, error: 'Datos incompletos' }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const pool = await getConnection(session?.user?.company);
        
        // Obtener fecha y hora actual
        const now = new Date();
        const horaStr = now.toLocaleTimeString('es-PE', { hour12: false, hour: '2-digit', minute: '2-digit' });

        await pool.request()
            .input('fecha', sql.DateTime, now)
            .input('hora', sql.VarChar(5), horaStr)
            .input('codpto', sql.Char(2), (codpto || '01').substring(0, 2))
            .input('concepto', sql.VarChar(100), concepto.substring(0, 100))
            .input('mone', sql.Char(1), 'S')
            .input('monto', sql.Decimal(18, 4), monto)
            .input('fechareg', sql.DateTime, now)
            .input('idapecaj', sql.Int, idapecaj)
            .input('codmotivo', sql.Char(2), codmotivo || '06') // Default 06 (Egreso diverso)
            .input('nroctacte', sql.VarChar(20), nroctacte || '')
            .input('tcam', sql.Decimal(18, 4), 1)
            .query(`
                INSERT INTO dtl_restpos_egrcaja (fecha, hora, codpto, concepto, mone, monto, nroctacte, nroope, fechareg, idapecaj, codmotivo, tcam)
                VALUES (@fecha, @hora, @codpto, @concepto, @mone, @monto, @nroctacte, '', @fechareg, @idapecaj, @codmotivo, @tcam)
            `);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in cash expense API:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
