const express = require('express');
const router = express.Router();
const { verifyTokenAndAdmin } = require('../middlewares/verifytoken');

const {getAllUsers,deleteUser,serchUser,ChangeAccountType,ChangeAccountTypeAccept,getAlldata} = require('../controllers/adminController');

// ✅ جلب كل المستخدمين الذين ينتظرون الموافقة
router.get('/Admin/ChangeAccountType', verifyTokenAndAdmin, ChangeAccountType);

// ✅ قبول طلب تغيير نوع الحساب
router.put('/Admin/ChangeAccountType/:id', verifyTokenAndAdmin, ChangeAccountTypeAccept);

// ✅ جلب كل المستخدمين
router.get('/Admin/Allusers', verifyTokenAndAdmin, getAllUsers);

// ✅ بحث عن مستخدم
router.post('/Admin/search', verifyTokenAndAdmin, serchUser);

// ✅ جلب كل البيانات
router.get('/Admin/AllData', verifyTokenAndAdmin, getAlldata);

// ✅ حذف مستخدم
router.delete('/Admin/users/:id', verifyTokenAndAdmin,deleteUser);

module.exports = router;
