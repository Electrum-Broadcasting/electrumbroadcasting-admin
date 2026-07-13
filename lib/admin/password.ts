import bcrypt from "bcryptjs";

const ADMIN_PASSWORD_ROUNDS = 12; // good v1 default

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ADMIN_PASSWORD_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
