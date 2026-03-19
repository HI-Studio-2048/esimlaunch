import { createClerkClient } from '@clerk/clerk-sdk-node';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';

type ClerkClientType = ReturnType<typeof createClerkClient>;

let cachedClerk: ClerkClientType | null = null;
let cachedSecretKey: string | null = null;

function getClerkClient(secretKey: string): ClerkClientType {
  if (cachedClerk && cachedSecretKey === secretKey) return cachedClerk;
  cachedClerk = createClerkClient({ secretKey });
  cachedSecretKey = secretKey;
  return cachedClerk;
}

/** Shared helper to verify Clerk JWT and resolve user. */
export async function verifyClerkToken(
  authHeader: string | undefined,
  config: ConfigService,
  prisma: PrismaService,
): Promise<{ userId: string; userEmail: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const clerkSecretKey = config.get<string>('CLERK_SECRET_KEY');
  if (!clerkSecretKey) throw new Error('CLERK_SECRET_KEY not configured');

  const clerk = getClerkClient(clerkSecretKey);
  const verified = await clerk.verifyToken(token);
  if (!verified?.sub) return null;

  const clerkUser = await clerk.users.getUser(verified.sub);
  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const normalizedEmail = email.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    user = await prisma.user.create({ data: { email: normalizedEmail } });
  }

  return { userId: user.id, userEmail: normalizedEmail };
}
