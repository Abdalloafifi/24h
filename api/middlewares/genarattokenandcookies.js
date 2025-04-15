const jwt = require('jsonwebtoken');
exports.genarateTokenAndCookies = (userId, res) => {
    // Create JWT token
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Set cookie options
    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        sameSite: 'lax', // Prevent CSRF attacks
    };
"devlpar"
    // Set cookie in response
    res.cookie('token', token, options);
    return token;
}