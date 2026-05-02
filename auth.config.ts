import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute = nextUrl.pathname.startsWith('/login');
      const isPublicApiRoute = nextUrl.pathname.startsWith('/api/auth');

      if (isAuthRoute || isPublicApiRoute) {
        if (isLoggedIn && isAuthRoute) {
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }
      
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
