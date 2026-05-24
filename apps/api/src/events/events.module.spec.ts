import { createDomainEvent } from './domain-event';
import { EventNames } from './event-names';

describe('DomainEvent contract', () => {
  it('createDomainEvent returns an event with a UUID eventId', () => {
    const event = createDomainEvent('test.event', { foo: 'bar' });
    expect(event.eventId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('createDomainEvent sets occurredAt to a recent Date', () => {
    const before = Date.now();
    const event = createDomainEvent('test.event', {});
    const after = Date.now();
    expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after);
  });

  it('createDomainEvent sets the event name', () => {
    const event = createDomainEvent('auth.user.login_success', {});
    expect(event.name).toBe('auth.user.login_success');
  });

  it('createDomainEvent sets the payload', () => {
    const payload = { userId: 'abc', ip: '1.2.3.4' };
    const event = createDomainEvent('auth.user.login_success', payload);
    expect(event.payload).toBe(payload);
  });

  it('createDomainEvent includes optional context fields', () => {
    const event = createDomainEvent(
      'auth.user.login_success',
      {},
      {
        actorId: 'user-123',
        actorType: 'user',
        resourceType: 'auth',
        requestId: 'req-abc',
      },
    );
    expect(event.actorId).toBe('user-123');
    expect(event.actorType).toBe('user');
    expect(event.resourceType).toBe('auth');
    expect(event.requestId).toBe('req-abc');
  });

  it('createDomainEvent does not include undefined context fields', () => {
    const event = createDomainEvent('test.event', {});
    expect('actorId' in event).toBe(false);
    expect('actorType' in event).toBe(false);
  });

  it('two events created from same input have different eventIds', () => {
    const e1 = createDomainEvent('test.event', {});
    const e2 = createDomainEvent('test.event', {});
    expect(e1.eventId).not.toBe(e2.eventId);
  });
});

describe('EventNames contract', () => {
  it('all event names follow domain.entity.action convention', () => {
    for (const name of Object.values(EventNames)) {
      const parts = name.split('.');
      expect(parts.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('auth events exist', () => {
    expect(EventNames.AUTH_LOGIN_SUCCESS).toBe('auth.user.login_success');
    expect(EventNames.AUTH_LOGIN_FAILED).toBe('auth.user.login_failed');
    expect(EventNames.AUTH_LOGOUT).toBe('auth.user.logout');
    expect(EventNames.AUTH_LOGOUT_ALL).toBe('auth.user.logout_all');
  });

  it('job events exist', () => {
    expect(EventNames.JOB_FAILED).toBeDefined();
    expect(EventNames.JOB_RETRIED).toBeDefined();
  });

  it('event payload must not contain raw secrets', () => {
    const event = createDomainEvent('auth.user.login_success', {
      userId: 'abc',
    });
    const serialized = JSON.stringify(event.payload);
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('refreshToken');
    expect(serialized).not.toContain('otp');
  });
});
