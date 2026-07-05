import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Generates a readable initial password for a new account (e.g.
 * "azul-cometa-4821"). Meant to be relayed to the collaborator once and
 * changed on first login — not a long-term secret, so readability matters
 * more than entropy here.
 */
export function generateInitialPassword(): string {
  const words = [
    "azul",
    "verde",
    "cometa",
    "rio",
    "sol",
    "luna",
    "carga",
    "vuelo",
    "puerto",
    "faro",
  ];
  const w1 = words[Math.floor(Math.random() * words.length)];
  const w2 = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w1}-${w2}-${n}`;
}
