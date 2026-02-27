import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";

/**
 * This page is required by Clerk to handle the OAuth callback.
 * After Google (or any OAuth provider) redirects back, Clerk processes
 * the tokens here before redirecting to the final destination.
 */
export default function SSOCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
      {/* Clerk handles the OAuth token exchange and then redirects to redirectUrlComplete */}
      <AuthenticateWithRedirectCallback />
    </div>
  );
}


