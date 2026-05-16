import { createWorkerRuntime } from './runtime';

describe('createWorkerRuntime', () => {
  it('returns minimal ready runtime metadata', () => {
    expect(createWorkerRuntime({ name: 'dragon-worker' })).toEqual({
      name: 'dragon-worker',
      status: 'ready',
    });
  });
});
