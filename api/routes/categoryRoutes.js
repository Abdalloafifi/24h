const express = require('express');
const router = express.Router();
const { verifyToken,verifyTokenAndAdmin } = require('../middlewares/verifytoken');

const { createCategory, getCategories } = require('../controllers/categoryController');

router.post('/', verifyTokenAndAdmin, createCategory);
router.get('/all', verifyToken, getCategories);



module.exports = router;