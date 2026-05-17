export function maskPhone(phone: string): string {
  const compact = phone.trim().replace(/[\s().\-\u2010-\u2015]/g, '');

  if (compact.length <= 2) {
    return '[masked-phone]';
  }

  return `***${compact.slice(-2)}`;
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');

  if (atIndex <= 0) {
    return '[masked-email]';
  }

  const domain = trimmed.slice(atIndex + 1);
  const domainSuffix = domain.includes('.') ? domain.slice(domain.lastIndexOf('.')) : '';

  return `***@***${domainSuffix}`;
}

export function maskSecret(value: string): string {
  if (value.length === 0) {
    return '[masked-empty]';
  }

  return `[masked:${value.length}]`;
}
