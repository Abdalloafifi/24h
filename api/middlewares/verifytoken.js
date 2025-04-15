const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
    const token = req.cookies.token || req.headers['authorization']?.split(' ')[1]; // الحصول على التوكن من الكوكيز أو الهيدر
    if (!token) {
        return res.status(403).json({ message: 'Token is required' });
        
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.user = await User.findById(decoded.id).select('-password -email'); // استبعاد كلمة المرور والبريد الإلكتروني من الاستجابة
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
const verifyTokenAndAuthorization = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.id === req.params.id ) {
            next();
        } else {
            res.status(403).json('You are not allowed to do that!');
        }
    });

}
const verifyTokenAndAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next();
        } else {
            res.status(403).json('You are not allowed to do that!');
        }
    });
};
module.exports = { verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin };