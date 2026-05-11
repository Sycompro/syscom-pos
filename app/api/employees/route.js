import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getPrismaClient } from '@/lib/prisma-client';
import logger from '@/lib/logger';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dbName = searchParams.get('db') || 'BdNava01';
  const query = searchParams.get('q') || '';

  const prisma = getPrismaClient(dbName);

  try {
    const employees = await prisma.empleado.findMany({
      where: {
        OR: [
          { nombres: { contains: query } },
          { ap_paterno: { contains: query } },
          { dni: { contains: query } }
        ]
      },
      take: 10,
      select: {
        codigo_emp: true,
        nombres: true,
        ap_paterno: true,
        ap_materno: true,
        dni: true
      }
    });

    return NextResponse.json(employees);
  } catch (error) {
    logger.error(`[EmployeesAPI] Error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
