import { MeProfileController } from './me-profile.controller';
import { ProfileController } from './profile.controller';
import { ProfileModule } from './profile.module';

describe('ProfileModule', () => {
  it('registers public and authenticated profile controllers', () => {
    const controllers = Reflect.getMetadata('controllers', ProfileModule) as unknown[] | undefined;

    expect(controllers ?? []).toEqual(
      expect.arrayContaining([ProfileController, MeProfileController]),
    );
  });
});
