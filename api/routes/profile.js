var express = require('express');
var router = express.Router();
const { verifyToken, verifyTokenAndAuthorization } = require('../middlewares/verifytoken');
const {  getUserProfile, updateUserProfile, updateUserAvatar } = require('../controllers/profileUser');
const upload = require('../middlewares/uplod');
 
router.get('/profile/:id', verifyTokenAndAuthorization, getUserProfile);
router.put('/profile/put/:id', verifyTokenAndAuthorization, updateUserProfile);
router.put('/profile/avatar/:id', verifyTokenAndAuthorization, upload.single('avatarProfile'), updateUserAvatar);


module.exports = router;
