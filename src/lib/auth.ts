/**
 * NextAuth configuration: Email (credentials), Google, Apple.
 * Users stored in MongoDB; session strategy JWT.
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { compare } from "bcryptjs";
import { findUserByEmail, upsertUserByOAuth } from "@/lib/db/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await findUserByEmail(credentials.email);
        if (!user || !user.passwordHash) return null;
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id ?? (user as any)._id?.toString(),
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          role: user.role ?? "user"
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID ?? "",
      clientSecret: process.env.APPLE_SECRET ?? "",
      allowDangerousEmailAccountLinking: true
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-in",
    error: "/sign-in"
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;
      if (!user.email) return false;
      if (account?.provider === "google" || account?.provider === "apple") {
        await upsertUserByOAuth({
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
          provider: account.provider,
          providerAccountId: account.providerAccountId
        });
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role ?? "user";
        if (!token.id && user.email) {
          const dbUser = await findUserByEmail(user.email);
          if (dbUser) {
            token.id = dbUser.id ?? (dbUser as any)._id?.toString();
            token.role = dbUser.role ?? "user";
          }
        }
      }
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
        token.picture = session.image ?? token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role ?? "user";
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development"
};
