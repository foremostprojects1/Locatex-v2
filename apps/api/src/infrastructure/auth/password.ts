import bcrypt from 'bcryptjs';

/**
 * bcrypt, deliberately: v1 stored bcrypt hashes, so migrated accounts keep working without
 * forcing everyone to reset their password. Cost 12 is roughly 250 ms on modern hardware —
 * slow enough to make offline guessing expensive, fast enough for a login request.
 */
const COST = 12;

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, COST);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

/**
 * Spends the same time as a real verification when no account exists, so response timing
 * cannot be used to enumerate which emails are registered.
 */
const DUMMY_HASH = bcrypt.hashSync('locatex-timing-equaliser', COST);
export const wasteVerificationTime = (): Promise<boolean> =>
  bcrypt.compare('locatex-timing-equaliser', DUMMY_HASH);
