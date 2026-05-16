import { getDatabaseConfig } from './database.config';

describe('getDatabaseConfig', () => {
  it('returns a MongoDB URI from the provided environment', () => {
    const config = getDatabaseConfig({
      MONGODB_URI:
        'mongodb://dragon_local:dragon_local_password@localhost:27017/dragon_local?authSource=admin',
    });

    expect(config).toEqual({
      uri: 'mongodb://dragon_local:dragon_local_password@localhost:27017/dragon_local?authSource=admin',
    });
  });

  it('trims the MongoDB URI', () => {
    const config = getDatabaseConfig({
      MONGODB_URI: '  mongodb://localhost:27017/dragon_local  ',
    });

    expect(config).toEqual({
      uri: 'mongodb://localhost:27017/dragon_local',
    });
  });

  it('throws when MONGODB_URI is missing', () => {
    expect(() => getDatabaseConfig({})).toThrow(
      'MONGODB_URI is required for the API database connection.',
    );
  });

  it('throws when MONGODB_URI is empty', () => {
    expect(() => getDatabaseConfig({ MONGODB_URI: '   ' })).toThrow(
      'MONGODB_URI is required for the API database connection.',
    );
  });
});
