/**
 * Bridge module so non-Clerk components (e.g. Navbar) can trigger Clerk signOut
 * without calling useClerk() conditionally (which violates React's rules of hooks).
 *
 * ClerkAuthSync (which lives inside ClerkProvider) registers the signOut function here.
 * Navbar reads it. No hooks called conditionally, no rules-of-hooks violations.
 */

let _signOut: (() => Promise<void>) | null = null;

export function registerClerkSignOut(fn: () => Promise<void>) {
  _signOut = fn;
}

export async function clerkSignOut(): Promise<void> {
  if (_signOut) {
    await _signOut();
  }
}

export function isClerkSignOutRegistered(): boolean {
  return _signOut !== null;
}
