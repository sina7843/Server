import { NotFoundException } from '@nestjs/common';
import { ContactMessageService } from './contact-message.service';

describe('ContactMessageService', () => {
  it('creates a message', async () => {
    const repo = { create: jest.fn().mockResolvedValue({ _id: '1' }), findById: jest.fn(), list: jest.fn(), deleteById: jest.fn() };
    const service = new ContactMessageService(repo as never);
    await service.submit({ name: 'A', email: 'a@b.c', message: 'hi', ipHash: 'h' });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'A', email: 'a@b.c', message: 'hi', ipHash: 'h' }),
    );
  });

  it('lists messages', async () => {
    const repo = { create: jest.fn(), findById: jest.fn(), list: jest.fn().mockResolvedValue({ items: [], total: 0 }), deleteById: jest.fn() };
    const service = new ContactMessageService(repo as never);
    const result = await service.list(1, 20);
    expect(result.total).toBe(0);
  });

  it('throws NotFound when deleting a missing message', async () => {
    const repo = { create: jest.fn(), findById: jest.fn(), list: jest.fn(), deleteById: jest.fn().mockResolvedValue(null) };
    const service = new ContactMessageService(repo as never);
    await expect(service.delete('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
