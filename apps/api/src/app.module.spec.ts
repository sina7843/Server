import 'reflect-metadata';
import { AppModule } from './app.module';
import { MediaModule } from './media/media.module';
import { ProfileModule } from './profiles/profile.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';

describe('AppModule wiring', () => {
  it('AppModule is defined', () => {
    expect(AppModule).toBeDefined();
  });

  it('MediaModule.imports contains no undefined entries', () => {
    const imports: unknown[] = Reflect.getMetadata('imports', MediaModule) ?? [];
    imports.forEach((entry, idx) => {
      expect(entry).not.toBeUndefined();
      if (entry === undefined) {
        throw new Error(
          `MediaModule.imports[${idx}] is undefined — likely a circular-dependency bug`,
        );
      }
    });
  });

  it('ProfileModule.imports contains no undefined entries', () => {
    const imports: unknown[] = Reflect.getMetadata('imports', ProfileModule) ?? [];
    imports.forEach((entry, idx) => {
      expect(entry).not.toBeUndefined();
      if (entry === undefined) {
        throw new Error(
          `ProfileModule.imports[${idx}] is undefined — likely a circular-dependency bug`,
        );
      }
    });
  });

  it('AuthModule.imports contains no undefined entries', () => {
    const imports: unknown[] = Reflect.getMetadata('imports', AuthModule) ?? [];
    imports.forEach((entry, idx) => {
      expect(entry).not.toBeUndefined();
      if (entry === undefined) {
        throw new Error(
          `AuthModule.imports[${idx}] is undefined — likely a circular-dependency bug`,
        );
      }
    });
  });

  it('RbacModule.imports contains no undefined entries', () => {
    const imports: unknown[] = Reflect.getMetadata('imports', RbacModule) ?? [];
    imports.forEach((entry, idx) => {
      expect(entry).not.toBeUndefined();
      if (entry === undefined) {
        throw new Error(
          `RbacModule.imports[${idx}] is undefined — likely a circular-dependency bug`,
        );
      }
    });
  });
});
