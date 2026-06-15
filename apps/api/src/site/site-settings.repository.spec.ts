import { SiteSettingsRepository } from './site-settings.repository';
import { SITE_SETTINGS_KEY } from './site-settings.schema';

function createModelMock() {
  return {
    findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    findOneAndUpdate: jest
      .fn()
      .mockReturnValue({ exec: jest.fn().mockResolvedValue({ key: SITE_SETTINGS_KEY }) }),
  };
}

describe('SiteSettingsRepository', () => {
  it('reads the singleton by fixed key', async () => {
    const model = createModelMock();
    const repo = new SiteSettingsRepository(model as never);
    await repo.findSingleton();
    expect(model.findOne).toHaveBeenCalledWith({ key: SITE_SETTINGS_KEY });
  });

  it('upserts the singleton on update', async () => {
    const model = createModelMock();
    const repo = new SiteSettingsRepository(model as never);
    await repo.upsert({
      about: { title: 'A', bodyJson: {}, bodyHtml: '<p>a</p>' },
      contact: { socials: [] },
    });
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { key: SITE_SETTINGS_KEY },
      expect.objectContaining({ $set: expect.any(Object) }),
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  });
});
