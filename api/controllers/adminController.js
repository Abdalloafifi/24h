const User = require('../models/User');
const Message = require("../models/MessagesClines");
const xss = require('xss');
const nodemailer = require('nodemailer');

const asyncHandler = require('express-async-handler');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET غير موجود في المتغيرات البيئية');
}




//get all user wait be nurse
exports.ChangeAccountType = asyncHandler(async (req, res) => {
    try {
        const PersonalPhoto = await User.find({ ChangePersonalPhoto: true });
        
        res.status(200).json(PersonalPhoto);
    } catch (error) {
        res.status(500).json({ error: error.message });
        
    }
});
exports.ChangeAccountTypeAccept = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.ChangePersonalPhoto = false;
        user.role = "nurse";
        await user.save();
        // Send email to the user
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'User Account Type Changed',
            text: `Your account type has been changed to ${user.role}.`,
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({
                    error: error.message 
                    });
            } else {
                console.log('Email sent: ' + info.response);
                return res.status(200).json({ message: 'Email sent successfully' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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
    const data = {
        text: xss(req.body.text)
    }

    try {
        const users = await User.find({
            $or: [
              { username: { $regex: data.text, $options: 'i' } },
              { email: { $regex: data.text, $options: 'i' } },
                { NationalNumber: { $regex: data.text } },
                { phone: { $regex: data.text } },
            ]
        })
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

exports.getAlldata = asyncHandler(async (req, res) => {
    try {
        const allMessagesUser = await Message.find({
            $or: [
                { senderId: req.body.id },
                { receiverId: req.body.id }
            ]
        }).populate('senderId receiverId')
        .sort({ createdAt: -1 });
        res.status(200).json(allMessagesUser);

        
    } catch (error) {
        res.status(500).json({ error: error.message });
        
    }
});

