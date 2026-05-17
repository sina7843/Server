import { SetMetadata } from '@nestjs/common';
import {
  OBJECT_POLICY_METADATA_KEY,
  type RequireObjectPolicyMetadata,
} from './object-policy-metadata';

export function RequireObjectPolicy(
  metadata: RequireObjectPolicyMetadata,
): MethodDecorator & ClassDecorator {
  return SetMetadata(OBJECT_POLICY_METADATA_KEY, metadata);
}
