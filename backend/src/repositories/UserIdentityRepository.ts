export interface UserIdentityRepository {
  /** The stable id of the Google account that owns the access token. */
  findUserId(accessToken: string): Promise<string>;
}
