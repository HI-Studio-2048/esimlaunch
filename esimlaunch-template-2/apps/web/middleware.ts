import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Protect these routes — Clerk will redirect to sign-in if not authenticated
const isProtectedRoute = createRouteMatcher(['/my-esims(.*)', '/account(.*)']);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
