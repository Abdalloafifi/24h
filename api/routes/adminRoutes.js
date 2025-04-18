const express = require('express');
const router = express.Router();
const { verifyTokenAndAdmin } = require('../middlewares/verifytoken');

const {viledLoginAdmin,getAllUsers,deleteUser,serchUser} = require('../controllers/adminController');


// ✅ جلب كل المستخدمين
router.get('/Admin/Allusers',verifyTokenAndAdmin, getAllUsers);

// ✅ حذف مستخدم
router.delete('/Admin/users/:id', verifyTokenAndAdmin,deleteUser);

// ✅ بحث عن مستخدم
router.post('/Admin/search',verifyTokenAndAdmin, serchUser);

module.exports = router;
