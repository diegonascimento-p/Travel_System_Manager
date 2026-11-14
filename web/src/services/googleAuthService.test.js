import { describe, expect, it, vi } from 'vitest';
import { createGoogleAuthService } from './googleAuthService.js';

const scope = 'https://www.googleapis.com/auth/calendar.readonly';

function fakeGoogle({ response, error, granted = true }) {
  const initTokenClient = vi.fn((config) => ({
    requestAccessToken: () => (error ? config.error_callback(error) : config.callback(response)),
  }));
  return {
    initTokenClient,
    window: { google: { accounts: { oauth2: { initTokenClient, hasGrantedAllScopes: () => granted } } } },
  };
}

function createService(google, loadScript = vi.fn().mockResolvedValue()) {
  return createGoogleAuthService({ clientId: 'client-1', scope, loadScript, getWindow: () => google.window });
}

describe('googleAuthService.connect', () => {
  it('resolves with the access token when the user grants calendar access', async () => {
    const google = fakeGoogle({ response: { access_token: 'token-123' } });

    await expect(createService(google).connect()).resolves.toBe('token-123');
    expect(google.initTokenClient).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'client-1', scope }));
  });

  it('rejects when the user denies access', async () => {
    const google = fakeGoogle({ response: { error: 'access_denied' } });

    await expect(createService(google).connect()).rejects.toMatchObject({ reason: 'access_denied' });
  });

  it('rejects when the calendar scope was not granted', async () => {
    const google = fakeGoogle({ response: { access_token: 'token-123' }, granted: false });

    await expect(createService(google).connect()).rejects.toMatchObject({ reason: 'access_denied' });
  });

  it('rejects when the popup is closed', async () => {
    const google = fakeGoogle({ error: { type: 'popup_closed' } });

    await expect(createService(google).connect()).rejects.toMatchObject({ reason: 'popup_closed' });
  });

  it('rejects when Google sign-in cannot be loaded, and retries loading next time', async () => {
    const google = fakeGoogle({ response: { access_token: 'token-123' } });
    const loadScript = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce();
    const service = createService(google, loadScript);

    await expect(service.connect()).rejects.toMatchObject({ reason: 'load_failed' });
    await expect(service.connect()).resolves.toBe('token-123');
    expect(loadScript).toHaveBeenCalledTimes(2);
  });

  it('loads the Google script only once', async () => {
    const google = fakeGoogle({ response: { access_token: 'token-123' } });
    const loadScript = vi.fn().mockResolvedValue();
    const service = createService(google, loadScript);

    await service.preload();
    await service.connect();

    expect(loadScript).toHaveBeenCalledTimes(1);
  });
});
