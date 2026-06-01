import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import {
  CAPACITY_COUNTING_STATUSES,
  isDuplicateBlocked,
  canAdminTransition,
  canUserWithdraw,
  assertNoDuplicateBlocking,
  assertAdminTransition,
  assertUserWithdraw,
  assertParticipantTypeCompatible,
} from './tournament-registration-policy';

// ─── Duplicate registration policy ───────────────────────────────────────────

describe('isDuplicateBlocked', () => {
  it('submitted blocks duplicate', () => expect(isDuplicateBlocked('submitted')).toBe(true));
  it('approved blocks duplicate', () => expect(isDuplicateBlocked('approved')).toBe(true));
  it('waitlisted blocks duplicate', () => expect(isDuplicateBlocked('waitlisted')).toBe(true));
  it('rejected blocks duplicate (conservative default)', () =>
    expect(isDuplicateBlocked('rejected')).toBe(true));
  it('withdrawn allows re-registration', () => expect(isDuplicateBlocked('withdrawn')).toBe(false));
  it('cancelled allows re-registration', () => expect(isDuplicateBlocked('cancelled')).toBe(false));
});

describe('assertNoDuplicateBlocking', () => {
  it('throws ConflictException for submitted', () => {
    expect(() => assertNoDuplicateBlocking('submitted')).toThrow(ConflictException);
  });
  it('throws ConflictException for approved', () => {
    expect(() => assertNoDuplicateBlocking('approved')).toThrow(ConflictException);
  });
  it('throws ConflictException for waitlisted', () => {
    expect(() => assertNoDuplicateBlocking('waitlisted')).toThrow(ConflictException);
  });
  it('throws ConflictException for rejected', () => {
    expect(() => assertNoDuplicateBlocking('rejected')).toThrow(ConflictException);
  });
  it('does not throw for withdrawn', () => {
    expect(() => assertNoDuplicateBlocking('withdrawn')).not.toThrow();
  });
  it('does not throw for cancelled', () => {
    expect(() => assertNoDuplicateBlocking('cancelled')).not.toThrow();
  });
});

// ─── Capacity counting statuses ───────────────────────────────────────────────

describe('CAPACITY_COUNTING_STATUSES', () => {
  it('includes submitted, approved, waitlisted', () => {
    expect(CAPACITY_COUNTING_STATUSES.has('submitted')).toBe(true);
    expect(CAPACITY_COUNTING_STATUSES.has('approved')).toBe(true);
    expect(CAPACITY_COUNTING_STATUSES.has('waitlisted')).toBe(true);
  });
  it('does not include rejected, withdrawn, cancelled', () => {
    expect(CAPACITY_COUNTING_STATUSES.has('rejected')).toBe(false);
    expect(CAPACITY_COUNTING_STATUSES.has('withdrawn')).toBe(false);
    expect(CAPACITY_COUNTING_STATUSES.has('cancelled')).toBe(false);
  });
});

// ─── Admin transitions ────────────────────────────────────────────────────────

describe('canAdminTransition — approved paths', () => {
  it('submitted -> approved', () => expect(canAdminTransition('submitted', 'approved')).toBe(true));
  it('waitlisted -> approved', () =>
    expect(canAdminTransition('waitlisted', 'approved')).toBe(true));
});

describe('canAdminTransition — rejected paths', () => {
  it('submitted -> rejected', () => expect(canAdminTransition('submitted', 'rejected')).toBe(true));
  it('approved -> rejected', () => expect(canAdminTransition('approved', 'rejected')).toBe(true));
  it('waitlisted -> rejected', () =>
    expect(canAdminTransition('waitlisted', 'rejected')).toBe(true));
});

describe('canAdminTransition — cancelled paths', () => {
  it('submitted -> cancelled', () =>
    expect(canAdminTransition('submitted', 'cancelled')).toBe(true));
  it('approved -> cancelled', () => expect(canAdminTransition('approved', 'cancelled')).toBe(true));
  it('waitlisted -> cancelled', () =>
    expect(canAdminTransition('waitlisted', 'cancelled')).toBe(true));
});

describe('canAdminTransition — terminal states reject all transitions', () => {
  it('rejected is terminal — no admin transitions', () => {
    expect(canAdminTransition('rejected', 'approved')).toBe(false);
    expect(canAdminTransition('rejected', 'cancelled')).toBe(false);
    expect(canAdminTransition('rejected', 'submitted')).toBe(false);
  });
  it('withdrawn is terminal — no admin transitions', () => {
    expect(canAdminTransition('withdrawn', 'approved')).toBe(false);
    expect(canAdminTransition('withdrawn', 'cancelled')).toBe(false);
  });
  it('cancelled is terminal — no admin transitions', () => {
    expect(canAdminTransition('cancelled', 'approved')).toBe(false);
    expect(canAdminTransition('cancelled', 'submitted')).toBe(false);
  });
});

describe('assertAdminTransition', () => {
  it('does not throw for legal transitions', () => {
    expect(() => assertAdminTransition('submitted', 'approved')).not.toThrow();
    expect(() => assertAdminTransition('approved', 'rejected')).not.toThrow();
    expect(() => assertAdminTransition('waitlisted', 'cancelled')).not.toThrow();
  });
  it('throws UnprocessableEntityException for illegal transitions', () => {
    expect(() => assertAdminTransition('rejected', 'approved')).toThrow(
      UnprocessableEntityException,
    );
    expect(() => assertAdminTransition('withdrawn', 'submitted')).toThrow(
      UnprocessableEntityException,
    );
    expect(() => assertAdminTransition('cancelled', 'approved')).toThrow(
      UnprocessableEntityException,
    );
  });
});

// ─── User withdraw ────────────────────────────────────────────────────────────

describe('canUserWithdraw', () => {
  it('submitted allows withdraw', () => expect(canUserWithdraw('submitted')).toBe(true));
  it('approved allows withdraw', () => expect(canUserWithdraw('approved')).toBe(true));
  it('waitlisted allows withdraw', () => expect(canUserWithdraw('waitlisted')).toBe(true));
  it('rejected does not allow withdraw', () => expect(canUserWithdraw('rejected')).toBe(false));
  it('withdrawn does not allow withdraw', () => expect(canUserWithdraw('withdrawn')).toBe(false));
  it('cancelled does not allow withdraw', () => expect(canUserWithdraw('cancelled')).toBe(false));
});

describe('assertUserWithdraw', () => {
  it('does not throw for submitted, approved, waitlisted', () => {
    expect(() => assertUserWithdraw('submitted')).not.toThrow();
    expect(() => assertUserWithdraw('approved')).not.toThrow();
    expect(() => assertUserWithdraw('waitlisted')).not.toThrow();
  });
  it('throws UnprocessableEntityException for rejected', () => {
    expect(() => assertUserWithdraw('rejected')).toThrow(UnprocessableEntityException);
  });
  it('throws UnprocessableEntityException for withdrawn', () => {
    expect(() => assertUserWithdraw('withdrawn')).toThrow(UnprocessableEntityException);
  });
  it('throws UnprocessableEntityException for cancelled', () => {
    expect(() => assertUserWithdraw('cancelled')).toThrow(UnprocessableEntityException);
  });
});

// ─── Participant type compatibility ───────────────────────────────────────────

describe('assertParticipantTypeCompatible', () => {
  it('individual tournament accepts individual registration', () => {
    expect(() => assertParticipantTypeCompatible('individual', 'individual')).not.toThrow();
  });
  it('individual tournament rejects team registration', () => {
    expect(() => assertParticipantTypeCompatible('individual', 'team')).toThrow(
      UnprocessableEntityException,
    );
  });
  it('team tournament accepts team registration', () => {
    expect(() => assertParticipantTypeCompatible('team', 'team')).not.toThrow();
  });
  it('team tournament rejects individual registration', () => {
    expect(() => assertParticipantTypeCompatible('team', 'individual')).toThrow(
      UnprocessableEntityException,
    );
  });
  it('both accepts individual registration', () => {
    expect(() => assertParticipantTypeCompatible('both', 'individual')).not.toThrow();
  });
  it('both accepts team registration', () => {
    expect(() => assertParticipantTypeCompatible('both', 'team')).not.toThrow();
  });
});
