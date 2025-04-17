const Admin = require('../models/admin');
const User = require('../models/User');
const Message = require("../models/MessagesClines");
const asyncHandler = require('express-async-handler');
const xss = require('xss');
const Joi = require('joi');
const {generateTokenAndSend} = require('../middlewares/genarattokenandcookies');
// التحقق من وجود المتغيرات البيئية
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET غير موجود في المتغيرات البيئية');
}

/**
 * @desc    تسجيل دخول المستخدم
 * @route   POST /api/admin/login
 * @access  عام
 */
exports.loginAdmin = asyncHandler(async (req, res) => {
    try {

        const data = {
            email: xss(req.body.email),
            password: xss(req.body.password),
        };
        console.log(req.body)
        // التحقق من صحة البيانات
        const { error } = validateLogin(data);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });

        }
        // البحث عن المستخدم
        const user = await Admin.findOne({  email: data.email  });
        if (!user) {
            return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة!' });
        }

        // التحقق من كلمة المرور
        const validPassword = await bcrypt.compare(data.password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة!' });
        }
        generateTokenAndSend(user._id, res);

        // إرسال الاستجابة
        res.status(200).json( user);
    } catch (error) {
        res.status(500).json({ error: error.message });

    }
});

// دالة التحقق من صحة بيانات الدخول
function validateLogin(data) {
    const schema = Joi.object({

        email: Joi.string().email().required().trim().messages({
            'string.email': 'البريد الإلكتروني غير صحيح',
            'any.required': 'البريد الإلكتروني مطلوب'
        }),
        password: passwordComplexity().required().messages({
            'any.required': 'كلمة المرور مطلوبة'
        })
    });
    return schema.validate(data);
}


/**
 * @desc    تسجيل خروج المستخدم
 * @route   POST /api/admin/logout
 * @access  خاص
 */
exports.logoutAdmin = asyncHandler(async (req, res) => {
    try {
        //clean header
        res.setHeader('x-auth-token', '');
        res.status(200).json({ message: 'تم تسجيل الخروج بنجاح!' });
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
        await user.remove();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

exports.serchUser = asyncHandler(async (req, res) => {
    try {
        const users = await User.find({ $regex: req.body.text, $options: 'i' } );
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

