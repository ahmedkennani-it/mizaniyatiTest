import type { Member } from '../../db/repositories';
import { canEdit, computeMemberAccess, isAdmin } from '../memberRights';

function member(overrides: Partial<Member> = {}): Member {
  return {
    id: 'm1',
    name: 'Youssef',
    role: 'editor',
    removedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('canEdit', () => {
  it('allows admin and editor', () => {
    expect(canEdit('admin')).toBe(true);
    expect(canEdit('editor')).toBe(true);
  });

  it('denies viewer', () => {
    expect(canEdit('viewer')).toBe(false);
  });
});

describe('isAdmin', () => {
  it('is true only for the admin role', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('editor')).toBe(false);
    expect(isAdmin('viewer')).toBe(false);
  });
});

describe('computeMemberAccess (US-054)', () => {
  it('grants edit access to a single member within an unlimited (Pro) limit', () => {
    const members = [member({ id: 'm1' })];
    expect(computeMemberAccess(members, 'm1', Number.MAX_SAFE_INTEGER)).toEqual({
      canEdit: true,
      isReadOnlyDueToPlanLimit: false,
    });
  });

  it('grants the sole member edit access under the Free limit of 1', () => {
    const members = [member({ id: 'm1' })];
    expect(computeMemberAccess(members, 'm1', 1)).toEqual({
      canEdit: true,
      isReadOnlyDueToPlanLimit: false,
    });
  });

  it('keeps the earliest-created member editable and locks out a later one beyond the limit', () => {
    const members = [
      member({ id: 'admin', createdAt: '2026-01-01T00:00:00.000Z' }),
      member({ id: 'invited', createdAt: '2026-02-01T00:00:00.000Z' }),
      member({ id: 'invited2', createdAt: '2026-03-01T00:00:00.000Z' }),
    ];

    expect(computeMemberAccess(members, 'admin', 1)).toEqual({
      canEdit: true,
      isReadOnlyDueToPlanLimit: false,
    });
    expect(computeMemberAccess(members, 'invited', 1)).toEqual({
      canEdit: false,
      isReadOnlyDueToPlanLimit: true,
    });
    expect(computeMemberAccess(members, 'invited2', 1)).toEqual({
      canEdit: false,
      isReadOnlyDueToPlanLimit: true,
    });
  });

  it('does not flag a viewer beyond the limit as "read-only due to the plan" — their role already denies edit', () => {
    const members = [
      member({ id: 'admin', role: 'admin', createdAt: '2026-01-01T00:00:00.000Z' }),
      member({ id: 'viewer', role: 'viewer', createdAt: '2026-02-01T00:00:00.000Z' }),
    ];

    expect(computeMemberAccess(members, 'viewer', 1)).toEqual({
      canEdit: false,
      isReadOnlyDueToPlanLimit: false,
    });
  });

  it('is insertion-order independent — seniority is derived from createdAt, not array order', () => {
    const members = [
      member({ id: 'newer', createdAt: '2026-03-01T00:00:00.000Z' }),
      member({ id: 'older', createdAt: '2026-01-01T00:00:00.000Z' }),
    ];

    expect(computeMemberAccess(members, 'older', 1).canEdit).toBe(true);
    expect(computeMemberAccess(members, 'newer', 1).canEdit).toBe(false);
  });

  it('returns no access for an unknown member id', () => {
    expect(computeMemberAccess([member()], 'missing', 5)).toEqual({
      canEdit: false,
      isReadOnlyDueToPlanLimit: false,
    });
  });
});
