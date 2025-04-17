const express = require('express');
const router = express.Router();
const { verifyTokenAndAdmin } = require('../middlewares/verifytoken');

const {loginAdmin,logoutAdmin,viledLoginAdmin,getAllUsers,deleteUser,serchUser} = require('../controllers/adminController');

// ✅ تسجيل الدخول
router.post('/Admin/login', verifyTokenAndAdmin,loginAdmin);


// ✅ تسجيل الخروج
router.post('/Admin/logout', verifyTokenAndAdmin,logoutAdmin);

// ✅ جلب كل المستخدمين
router.get('/Admin/Allusers',verifyTokenAndAdmin, getAllUsers);

// ✅ حذف مستخدم
router.delete('/Admin/users/:id', verifyTokenAndAdmin,deleteUser);

// ✅ بحث عن مستخدم
router.post('/Admin/search',verifyTokenAndAdmin, serchUser);

module.exports = router;
