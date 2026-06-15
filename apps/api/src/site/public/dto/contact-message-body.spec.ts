import { BadRequestException } from '@nestjs/common';
import { parseContactMessageBody, isHoneypotTriggered } from './contact-message-body';

describe('parseContactMessageBody', () => {
  it('parses a valid body', () => {
    const result = parseContactMessageBody({ name: 'Ali', email: 'a@b.c', message: 'hello' });
    expect(result.name).toBe('Ali');
    expect(result.subject).toBeUndefined();
  });

  it('rejects missing required fields', () => {
    expect(() => parseContactMessageBody({ name: '', email: '', message: '' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects an invalid email', () => {
    expect(() => parseContactMessageBody({ name: 'A', email: 'nope', message: 'x' })).toThrow(
      BadRequestException,
    );
  });

  it('rejects an over-long message', () => {
    const long = 'x'.repeat(5001);
    expect(() => parseContactMessageBody({ name: 'A', email: 'a@b.c', message: long })).toThrow(
      BadRequestException,
    );
  });

  it('detects a filled honeypot', () => {
    expect(isHoneypotTriggered({ website: 'http://spam' })).toBe(true);
    expect(isHoneypotTriggered({})).toBe(false);
  });
});
