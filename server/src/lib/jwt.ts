import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error('JWT_SECRET is not set');

export function signSession(memberId: string): string {
  return jwt.sign({ sub: memberId }, secret!, { expiresIn: '365d' });
}

export function verifySession(token: string): string | null {
  try {
    const payload = jwt.verify(token, secret!);
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}
