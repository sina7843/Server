import { processSearchJob } from './search-processor';

function makeJob(name: string, data: Record<string, unknown> = {}) {
  return { name, data, attemptsMade: 0 } as never;
}

function makeUpdater() {
  return jest.fn().mockResolvedValue(undefined);
}

describe('processSearchJob', () => {
  it('completes search.reindex_all without throwing', async () => {
    const updater = makeUpdater();
    await expect(processSearchJob(makeJob('search.reindex_all'), updater)).resolves.toBeUndefined();
  });

  it('completes search.index_content without throwing', async () => {
    const updater = makeUpdater();
    await expect(
      processSearchJob(makeJob('search.index_content'), updater),
    ).resolves.toBeUndefined();
  });

  it('completes search.remove_content without throwing', async () => {
    const updater = makeUpdater();
    await expect(
      processSearchJob(makeJob('search.remove_content'), updater),
    ).resolves.toBeUndefined();
  });

  it('throws for unknown job name', async () => {
    const updater = makeUpdater();
    await expect(
      processSearchJob(makeJob('search.unknown_job', { jobLogId: 'id1' }), updater),
    ).rejects.toThrow('Unknown search job');
  });

  it('calls updateStatus with processing then completed when jobLogId provided', async () => {
    const updater = makeUpdater();
    await processSearchJob(makeJob('search.reindex_all', { jobLogId: 'log-1' }), updater);

    expect(updater).toHaveBeenCalledTimes(2);
    expect(updater).toHaveBeenNthCalledWith(1, 'log-1', 'processing', expect.any(Object));
    expect(updater).toHaveBeenNthCalledWith(2, 'log-1', 'completed', expect.any(Object));
  });

  it('does not call updateStatus when no jobLogId', async () => {
    const updater = makeUpdater();
    await processSearchJob(makeJob('search.reindex_all'), updater);

    expect(updater).not.toHaveBeenCalled();
  });

  it('does not require external search engine infrastructure', async () => {
    // All search jobs complete successfully with no external dependencies
    const updater = makeUpdater();
    for (const name of ['search.reindex_all', 'search.index_content', 'search.remove_content']) {
      await expect(processSearchJob(makeJob(name), updater)).resolves.toBeUndefined();
    }
  });
});
