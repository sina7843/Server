import { BadRequestException } from '@nestjs/common';

export interface ParsedContactMessageBody {
  readonly name: string;
  readonly email: string;
  readonly subject?: string;
  readonly message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE = 5000;
const MAX_FIELD = 200;

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function isHoneypotTriggered(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false;
  const website = (body as Record<string, unknown>).website;
  return typeof website === 'string' && website.trim().length > 0;
}

export function parseContactMessageBody(body: unknown): ParsedContactMessageBody {
  if (typeof body !== 'object' || body === null) {
    throw new BadRequestException('Invalid request body.');
  }
  const raw = body as Record<string, unknown>;
  const name = str(raw.name);
  const email = str(raw.email);
  const message = str(raw.message);
  const subject = str(raw.subject);

  if (!name || name.length > MAX_FIELD) throw new BadRequestException('Invalid name.');
  if (!email || !EMAIL_RE.test(email) || email.length > MAX_FIELD)
    throw new BadRequestException('Invalid email.');
  if (!message) throw new BadRequestException('Message is required.');
  if (message.length > MAX_MESSAGE) throw new BadRequestException('Message is too long.');
  if (subject.length > MAX_FIELD) throw new BadRequestException('Subject is too long.');

  return { name, email, message, ...(subject ? { subject } : {}) };
}
