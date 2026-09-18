import bcrypt from 'bcryptjs';

// Cost factor 12 balances strong resistance to offline brute-force against
// acceptable login latency on typical hardware.
const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_COST);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
