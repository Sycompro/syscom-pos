import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getConnection } from "@/lib/db";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "ERP Credentials",
      credentials: {
        company: { label: "Empresa", type: "text" },
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password || !credentials?.company) {
          throw new Error("Faltan credenciales");
        }

        try {
          const pool = await getConnection(credentials.company);
          
          // Encriptar la contraseña para comparar con la base de datos (Navasoft style: charCode + 105)
          const encryptedPassword = Array.from(credentials.password)
            .map(char => String.fromCharCode(char.charCodeAt(0) + 105))
            .join("");

          const result = await pool.request()
            .input('user', credentials.username)
            .input('pass', encryptedPassword)
            .query("SELECT TOP 1 Usuario, Nombres, Apellidos, codusu, Codven FROM TBL_USUARIO WHERE RTRIM(Usuario) = @user AND Clave = @pass AND Estado = 1");

          if (result.recordset.length > 0) {
            const user = result.recordset[0];
            return {
              id: user.codusu?.trim() || user.Usuario?.trim(),
              name: `${user.Nombres?.trim()} ${user.Apellidos?.trim()}`,
              username: user.Usuario?.trim(),
              company: credentials.company,
              codven: user.Codven?.trim()
            };
          }
          return null;
        } catch (err) {
          console.error("Auth error:", err);
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
        token.codven = user.codven;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.company = token.company;
        session.user.username = token.username;
        session.user.codven = token.codven;
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
