import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getConnection } from '@/lib/db';
import sql from 'mssql';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.company) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const pool = await getConnection(session.user.company);

        // Obtener fecha actual en zona horaria de Perú
        const getPeruTime = () => {
            const n = new Date();
            return new Date(n.toLocaleString("en-US", { timeZone: "America/Lima" }));
        };

        const now = getPeruTime();
        now.setHours(0, 0, 0, 0);

        // Formatear fechas para la consulta SQL
        const nowStr = now.toISOString().split('T')[0];

        // 1. Consulta para Membresías: Vencidas en los últimos 15 días o por vencer en los próximos 5 días
        const resultMemberships = await pool.request()
            .query(`
                SELECT 
                    RTRIM(c.codcli) as id,
                    RTRIM(c.nomcli) as name,
                    RTRIM(c.celcli) as phone,
                    CONVERT(varchar, c.fecinipres, 23) as startDate,
                    CONVERT(varchar, c.fecfinpres, 23) as endDate,
                    ISNULL(RTRIM(pun.nompto), 'SEDE 01') as sede
                FROM mst01cli c
                OUTER APPLY (
                    SELECT TOP 1 f.Codpto
                    FROM mst01fac f
                    JOIN dtl01fac d ON f.cdocu = d.cdocu AND f.ndocu = d.ndocu
                    JOIN prd0101 pr ON d.codi = pr.codi
                    WHERE f.codcli = c.codcli AND ISNUMERIC(pr.Usr_003) = 1 AND CAST(pr.Usr_003 as int) > 0
                    ORDER BY f.fecha DESC
                ) lastSede
                LEFT JOIN tbl01pto pun ON lastSede.Codpto = pun.codpto
                WHERE c.fecfinpres IS NOT NULL 
                  AND c.fecfinpres != '1900-01-01'
                  AND c.fecfinpres >= DATEADD(day, -15, GETDATE()) 
                  AND c.fecfinpres <= DATEADD(day, 5, GETDATE())
            `);

        // 2. Consulta para Cumpleañeros de Hoy
        const resultBirthdays = await pool.request()
            .query(`
                SELECT 
                    RTRIM(c.codcli) as id,
                    RTRIM(c.nomcli) as name,
                    RTRIM(c.celcli) as phone,
                    CONVERT(varchar, c.fecnac, 23) as birthDate,
                    ISNULL(RTRIM(pun.nompto), 'SEDE 01') as sede
                FROM mst01cli c
                OUTER APPLY (
                    SELECT TOP 1 f.Codpto
                    FROM mst01fac f
                    JOIN dtl01fac d ON f.cdocu = d.cdocu AND f.ndocu = d.ndocu
                    JOIN prd0101 pr ON d.codi = pr.codi
                    WHERE f.codcli = c.codcli AND ISNUMERIC(pr.Usr_003) = 1 AND CAST(pr.Usr_003 as int) > 0
                    ORDER BY f.fecha DESC
                ) lastSede
                LEFT JOIN tbl01pto pun ON lastSede.Codpto = pun.codpto
                WHERE MONTH(c.fecnac) = MONTH(GETDATE()) 
                  AND DAY(c.fecnac) = DAY(GETDATE())
            `);

        const alerts = [];

        // Procesar Membresías
        resultMemberships.recordset.forEach(m => {
            if (!m.endDate) return;
            const [y, mon, d] = m.endDate.split('-').map(Number);
            const expDate = new Date(y, mon - 1, d);
            expDate.setHours(0,0,0,0);

            // Calcular diferencia en días enteros
            const diffTime = expDate.getTime() - now.getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysLeft < 0) {
                // Membresía Vencida
                alerts.push({
                    id: `memb-exp-${m.id}-${m.endDate}`,
                    type: 'membership_expired',
                    title: 'Membresía Vencida',
                    message: `La membresía de ${m.name} venció hace ${Math.abs(daysLeft)} días (${m.endDate}).`,
                    targetTab: 'memberships',
                    targetSearch: m.id,
                    targetStatus: 'vencido',
                    metadata: {
                        codcli: m.id,
                        name: m.name,
                        phone: m.phone,
                        endDate: m.endDate,
                        sede: m.sede
                    },
                    date: expDate.toISOString()
                });
            } else {
                // Membresía Por Vencer
                let diffStr = '';
                if (daysLeft === 0) diffStr = 'hoy mismo';
                else if (daysLeft === 1) diffStr = 'mañana';
                else diffStr = `en ${daysLeft} días`;

                alerts.push({
                    id: `memb-exp-${m.id}-${m.endDate}`,
                    type: 'membership_expiring',
                    title: 'Membresía por Vencer',
                    message: `La membresía de ${m.name} vence ${diffStr} (${m.endDate}).`,
                    targetTab: 'memberships',
                    targetSearch: m.id,
                    targetStatus: 'por vencer',
                    metadata: {
                        codcli: m.id,
                        name: m.name,
                        phone: m.phone,
                        endDate: m.endDate,
                        sede: m.sede
                    },
                    date: expDate.toISOString()
                });
            }
        });

        // Procesar Cumpleaños
        resultBirthdays.recordset.forEach(b => {
            const currentYear = now.getFullYear();
            alerts.push({
                id: `bday-${b.id}-${currentYear}`,
                type: 'birthday',
                title: 'Cumpleaños de Socio',
                message: `¡Hoy es el cumpleaños de ${b.name}!`,
                targetTab: 'memberships',
                targetSearch: b.id,
                targetStatus: 'all',
                metadata: {
                    codcli: b.id,
                    name: b.name,
                    phone: b.phone,
                    sede: b.sede,
                    birthDate: b.birthDate
                },
                date: now.toISOString()
            });
        });

        // Ordenar alertas: primero las de hoy/vencidas hoy, luego por vencer, luego cumpleaños
        const typePriority = { 'membership_expired': 1, 'membership_expiring': 2, 'birthday': 3 };
        alerts.sort((a, b) => typePriority[a.type] - typePriority[b.type]);

        return NextResponse.json({ success: true, alerts });

    } catch (err) {
        console.error('Error in alerts API:', err);
        return NextResponse.json({ error: err.message || 'Error interno al procesar alertas' }, { status: 500 });
    }
}
