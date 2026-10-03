import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

let dummyHash: string | null = null;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

/** Compared for unknown emails so login timing does not reveal whether an account exists. */
export function dummyPasswordHash(): string {
  dummyHash ??= bcrypt.hashSync('campusflow-timing-pad', env.BCRYPT_ROUNDS);
  return dummyHash;
}
