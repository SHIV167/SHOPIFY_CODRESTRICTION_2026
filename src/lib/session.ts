import { cookies } from 'next/headers';
import { signHmacSha256Hex } from './hmac';

const SESSION_COOKIE = 'cod_session';

export function setShopSession(shop: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required');

  const sig = signHmacSha256Hex(secret, shop);
  const signed = `${shop}|${sig}`;
  cookies().set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function getShopFromSession(): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  const value = cookies().get(SESSION_COOKIE)?.value;
  if (!value) return null;

  const [shop, sig] = value.split('|');
  if (!shop || !sig) return null;

  const expected = signHmacSha256Hex(secret, shop);
  if (sig !== expected) return null;

  return shop;
}

export function clearShopSession() {
  cookies().delete(SESSION_COOKIE);
}
