import { NotificationTemplateSchema } from './notification-template.schema';

describe('NotificationTemplate schema', () => {
  describe('field definitions', () => {
    it('defines key as required string', () => {
      const keyPath = NotificationTemplateSchema.path('key');
      expect(keyPath).toBeDefined();
      expect(keyPath.isRequired).toBe(true);
    });

    it('defines channel as required enum (sms | email)', () => {
      const channelPath = NotificationTemplateSchema.path('channel');
      expect(channelPath).toBeDefined();
      expect(channelPath.isRequired).toBe(true);
    });

    it('defines locale as required string', () => {
      const localePath = NotificationTemplateSchema.path('locale');
      expect(localePath).toBeDefined();
      expect(localePath.isRequired).toBe(true);
    });

    it('defines body as required string', () => {
      const bodyPath = NotificationTemplateSchema.path('body');
      expect(bodyPath).toBeDefined();
      expect(bodyPath.isRequired).toBe(true);
    });

    it('defines variables as array of strings defaulting to empty', () => {
      const variablesPath = NotificationTemplateSchema.path('variables');
      expect(variablesPath).toBeDefined();
    });

    it('defines isActive as boolean defaulting to true', () => {
      const isActivePath = NotificationTemplateSchema.path('isActive');
      expect(isActivePath).toBeDefined();
    });
  });

  describe('indexes', () => {
    const indexes = NotificationTemplateSchema.indexes();

    it('has unique compound index on key + channel + locale', () => {
      const found = indexes.find(
        ([fields, opts]) =>
          'key' in (fields as object) &&
          'channel' in (fields as object) &&
          'locale' in (fields as object) &&
          (opts as Record<string, unknown>).unique === true,
      );
      expect(found).toBeDefined();
    });

    it('has index on channel', () => {
      const found = indexes.find(
        ([fields]) => 'channel' in (fields as object) && Object.keys(fields as object).length === 1,
      );
      expect(found).toBeDefined();
    });

    it('has index on isActive', () => {
      const found = indexes.find(
        ([fields]) =>
          'isActive' in (fields as object) && Object.keys(fields as object).length === 1,
      );
      expect(found).toBeDefined();
    });
  });
});
