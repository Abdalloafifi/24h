const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const CRYPTO_SECRET = process.env.CRYPTO_SECRET;

function generateEncryptedToken(userId) {
    // 1. Generate JWT
    const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });

    // 2. Encrypt JWT using AES-256-CBC
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(CRYPTO_SECRET, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(token);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // 3. Return encrypted token as hex string: iv:token
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

exports.generateTokenAndSend = (userId, res) => {
    const encryptedToken = generateEncryptedToken(userId);

    // 👇 Send token in a custom response header (e.g., x-auth-token)
    res.setHeader('x-auth-token', encryptedToken);
};
