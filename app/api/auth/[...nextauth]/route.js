import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getConnection } from "@/lib/db";
import sql from "mssql";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "ERP Credentials",
      credentials: {
        code: { label: "Código Empresa", type: "text" },
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.code || !credentials?.username || !credentials?.password) {
          throw new Error("Faltan credenciales");
        }

        try {
          // Paso 1: Validar empresa en BdNavaSys (Sincronizado con Dashboard)
          const mainPool = await getConnection('BdNavaSys');
          const ciaResult = await mainPool.request()
            .input('code', credentials.code)
            .query("SELECT codcia, nomcia FROM sysnavacia WHERE codcia = @code AND estado = 1");

          if (ciaResult.recordset.length === 0) {
            console.error("[Auth] Código de empresa no válido en BdNavaSys:", credentials.code);
            return null;
          }

          const dbName = `BdNava${credentials.code.trim()}`;
          console.log(`[Auth] Intentando autenticar en base de datos: ${dbName}`);
          const empresaPool = await getConnection(dbName);
          
          // Paso 2: Detección de Esquema de Usuario (ERP vs POS)
          
          // Intentar Esquema ERP (TBL_USUARIO)
          try {
             const erpResult = await empresaPool.request()
                .input('usuario', credentials.username)
                .input('clave', credentials.password)
                .query("SELECT Usuario, Clave, Nombres + ' ' + Apellidos as FullName FROM TBL_USUARIO WHERE Usuario = @usuario AND Clave = @clave AND Estado = 1");
             
             if (erpResult.recordset.length > 0) {
                const user = erpResult.recordset[0];
                return {
                  id: user.Usuario,
                  name: user.FullName || user.Usuario,
                  username: user.Usuario,
                  company: dbName,
                  schema: 'ERP'
                };
             }
          } catch (e) {
             console.log(`[Auth] No se encontró tabla TBL_USUARIO en ${dbName}, probando esquema POS...`);
          }

          // Intentar Esquema POS (Sede + Empresa)
          try {
             const posResult = await empresaPool.request()
                .input('usuario', credentials.username)
                .input('clave', credentials.password)
                .query(`
                  SELECT 
                    S.SedeId, S.Direccion AS SedeName, 
                    E.EmpresaId, E.RazonSocial, E.Ruc
                  FROM Sede AS S
                  INNER JOIN Empresa AS E ON S.EmpresaId = E.EmpresaId
                  WHERE S.Usuario = @usuario AND S.Clave = @clave
                `);
             
             if (posResult.recordset.length > 0) {
                const seat = posResult.recordset[0];
                return {
                  id: String(seat.SedeId),
                  name: seat.RazonSocial?.trim() || 'Empresa',
                  username: credentials.username,
                  company: dbName,
                  empresaId: seat.EmpresaId,
                  sedeId: seat.SedeId,
                  sedeName: seat.SedeName?.trim(),
                  ruc: seat.Ruc?.trim(),
                  schema: 'POS'
                };
             }
          } catch (e) {
             console.error(`[Auth] Error al consultar esquema POS en ${dbName}:`, e.message);
          }

          console.warn(`[Auth] Credenciales incorrectas para ${credentials.username} en ${dbName}`);
          return null;
        } catch (err) {
          console.error("[Auth] Error Crítico:", err.message);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        const allowedEmails = process.env.ALLOWED_EMAILS 
            ? process.env.ALLOWED_EMAILS.split(',').map(e => e.trim().toLowerCase()) 
            : [];
        return allowedEmails.includes(user.email.toLowerCase());
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.company = user.company;
        token.username = user.username;
        token.empresaId = user.empresaId;
        token.sedeId = user.sedeId;
        token.sedeName = user.sedeName;
        token.ruc = user.ruc;
        token.schema = user.schema;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.company = token.company;
        session.user.username = token.username;
        session.user.empresaId = token.empresaId;
        session.user.sedeId = token.sedeId;
        session.user.sedeName = token.sedeName;
        session.user.ruc = token.ruc;
        session.user.schema = token.schema;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
