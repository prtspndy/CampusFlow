import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

/**
 * Compared when the email is unknown so login timing does not reveal whether an account exists.
 * The plaintext is not a credential and is never logged.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('campusflow-timing-pad', env.BCRYPT_ROUNDS);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function dummyPasswordHash(): string {
  return DUMMY_PASSWORD_HASH;
}
