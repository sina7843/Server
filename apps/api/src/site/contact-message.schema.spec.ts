import { model } from 'mongoose';
import { ContactMessage, ContactMessageSchema } from './contact-message.schema';

describe('ContactMessage schema', () => {
  const ContactMessageModel = model(ContactMessage.name, ContactMessageSchema);

  it('requires name, email, message', () => {
    const doc = new ContactMessageModel({});
    const err = doc.validateSync();
    expect(err?.errors.name).toBeDefined();
    expect(err?.errors.email).toBeDefined();
    expect(err?.errors.message).toBeDefined();
  });

  it('accepts a valid message', () => {
    const doc = new ContactMessageModel({ name: 'A', email: 'a@b.c', message: 'hi' });
    expect(doc.validateSync()).toBeUndefined();
  });
});
