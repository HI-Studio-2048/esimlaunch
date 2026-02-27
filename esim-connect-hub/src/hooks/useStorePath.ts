import { useParams } from "react-router-dom";

/**
 * Returns the base path for the current store context.
 * - When accessed via /store/:subdomain/* → "/store/:subdomain"
 * - When accessed via /demo-store/* → "/demo-store"
 */
export function useStorePath(): string {
  const params = useParams<{ subdomain?: string }>();
  return params.subdomain ? `/store/${params.subdomain}` : "/demo-store";
}
