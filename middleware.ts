import { clerkMiddleware } from '@clerk/nextjs/server';

// Everything is public. Clerk is available for sign-in but never required —
// guests use localStorage; signed-in users get Convex persistence.
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
