const User = require('../models/User');
const Message = require("../models/MessagesClines");
const asyncHandler = require('express-async-handler');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET غير موجود في المتغيرات البيئية');
}





exports.getAllUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.deleteUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await User.deleteOne({ _id: user._id });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

exports.serchUser = asyncHandler(async (req, res) => {
    try {
        const users = await User.find({
            $or: [
              { username: { $regex: req.body.text, $options: 'i' } },
              { email: { $regex: req.body.text, $options: 'i' } },
              { NationalNumber: { $regex: req.body.text, $options: 'i' } }
            ]
          });        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

