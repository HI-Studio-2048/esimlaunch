import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/sessionService';

const SESSION_COOKIE_NAME = 'session_token';

function parseCookie(cookieHeader: string): Record<string, string> {
  const out: Record<string, string> = {};
  cookieHeader.split(';').forEach((part) => {
    const [key, ...v] = part.trim().split('=');
    if (key && v.length) out[key] = decodeURIComponent(v.join('=').trim());
  });
  return out;
}

/**
 * Try to authenticate from session cookie (DB-backed). Used so auth works across devices via login (no localStorage).
 */
export async function authenticateSessionCookie(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const cookieHeader = req.headers.cookie;
  const token = cookieHeader ? parseCookie(cookieHeader)[SESSION_COOKIE_NAME] : undefined;
  if (!token) {
    return next();
  }
  try {
    const session = await sessionService.getSession(token);
    if (session?.merchant) {
      const m = session.merchant;
      if (!m.isActive) {
        return next();
      }
      req.merchant = {
        id: m.id,
        email: m.email,
        serviceType: m.serviceType,
      };
    }
  } catch (_) {
    // ignore
  }
  next();
}

export { SESSION_COOKIE_NAME };
