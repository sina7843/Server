export interface RbacGenericResponse {
  readonly success: true;
  readonly message: string;
}

export function createRbacGenericResponse(message: string): RbacGenericResponse {
  return {
    success: true,
    message,
  };
}
