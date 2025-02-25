import crypto from 'crypto';

export function hashWithSalt(data, salt = 'default_salt') {
    return crypto.createHmac('sha256', salt).update(data).digest('hex');
}
