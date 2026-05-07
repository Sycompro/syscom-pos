import { PrismaClient } from '@prisma/client';

// Cache global persistente para evitar múltiples pools de conexiones
const globalForPrisma = global;
const prismaClients = globalForPrisma.prismaClients || {};

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaClients = prismaClients;
}

/**
 * Crea o recupera una instancia de Prisma configurada para una base de datos específica.
 */
export const getPrismaClient = (dbName) => {
  if (prismaClients[dbName]) {
    return prismaClients[dbName];
  }

  const server = process.env.DB_SERVER;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  
  // connectionLimit=5: Suficiente para concurrencia básica sin saturar el SQL Server
  // poolTimeout=90: Paciencia extendida para esperar una conexión libre
  const url = `sqlserver://${server};database=${dbName};user=${user};password=${password};encrypt=false;trustServerCertificate=true;connectionLimit=5;connectionTimeout=60;poolTimeout=90;`;

  console.log(`[Prisma] Creando instancia única para ${dbName}`);

  const client = new PrismaClient({
    datasourceUrl: url,
  });

  prismaClients[dbName] = client;
  
  return client;
};
