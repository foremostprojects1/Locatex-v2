import { z } from 'zod';

/**
 * Three stored roles. "Viewer" is the anonymous visitor and deliberately has no record —
 * see decision D3.
 */
export const ROLES = ['buyer', 'broker', 'admin'] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

/** The principal a request runs as, including the anonymous case. */
export type Principal = { kind: 'guest' } | { kind: 'user'; id: string; role: Role };

export const isAtLeastBroker = (p: Principal): boolean =>
  p.kind === 'user' && (p.role === 'broker' || p.role === 'admin');
