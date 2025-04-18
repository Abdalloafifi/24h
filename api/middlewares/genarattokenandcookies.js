const jwt = require('jsonwebtoken');
const crypto = require('crypto');
if (!process.env.JWT_SECRET || !process.env.CRYPTO_SECRET) {
    throw new Error('  المتغيرات غير موجوده في البيئية');
}
 

const JWT_SECRET = process.env.JWT_SECRET;
const CRYPTO_SECRET = process.env.CRYPTO_SECRET;

function generateEncryptedToken(user) {
    // 1. Generate JWT
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    
    // 2. Encrypt JWT using AES-256-CBC
    const iv = crypto.randomBytes(16);
    const salt = crypto.randomBytes(16).toString('hex');
    const key = crypto.scryptSync(CRYPTO_SECRET, salt, 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(token);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // 3. Return encrypted token as hex string: iv:token
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

exports.generateTokenAndSend = (user, res) => {
    const encryptedToken = generateEncryptedToken(user);

    // 👇 Send token in a custom response header (e.g., x-auth-token)
    res.setHeader('auth-token', encryptedToken);
};
