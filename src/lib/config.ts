// src/lib/config.ts (shim for backward compatibility)
export { getENV } from './env';

function getCredentialSource() {
    const { getENV } = require('./env');
    const ENV = getENV();
    if (ENV.FIREBASE_SERVICE_ACCOUNT_B64) return 'b64';
    if (ENV.GOOGLE_APPLICATION_CREDENTIALS) return 'file';
    if (ENV.FIREBASE_PROJECT_ID) return 'triplet';
    return 'adc_or_missing';
}

export const config = {
    get credentialSource() {
        return getCredentialSource()
    }
};
