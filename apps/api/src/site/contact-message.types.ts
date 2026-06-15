export interface CreateContactMessageInput {
  readonly name: string;
  readonly email: string;
  readonly subject?: string;
  readonly message: string;
  readonly ipHash?: string;
}

export interface ContactMessageListFilter {
  readonly page: number;
  readonly limit: number;
}
