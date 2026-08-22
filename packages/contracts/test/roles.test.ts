import { describe, expect, it } from 'vitest';
import { ROLES, isAtLeastBroker, roleSchema, type Principal } from '../src/roles.js';

describe('roles (decision D3 and D4)', () => {
  it('stores three roles — viewer is the anonymous visitor, not a record', () => {
    expect(ROLES).toEqual(['buyer', 'broker', 'admin']);
    expect(roleSchema.safeParse('viewer').success).toBe(false);
  });

  it('lets only brokers and admins act as listing owners', () => {
    const guest: Principal = { kind: 'guest' };
    const buyer: Principal = { kind: 'user', id: 'u1', role: 'buyer' };
    const broker: Principal = { kind: 'user', id: 'u2', role: 'broker' };
    const admin: Principal = { kind: 'user', id: 'u3', role: 'admin' };

    expect(isAtLeastBroker(guest)).toBe(false);
    expect(isAtLeastBroker(buyer)).toBe(false); // a buyer must be approved first — D4
    expect(isAtLeastBroker(broker)).toBe(true);
    expect(isAtLeastBroker(admin)).toBe(true);
  });
});
