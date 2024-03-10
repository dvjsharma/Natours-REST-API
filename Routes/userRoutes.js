const { getAllUsers, getUser, createUser, updateUser, deleteUser, updateMe, deleteMe} = require("../Controllers/userController");
const { signup, login, protect, forgotPassword, resetPassword, updatePassword} = require("../Controllers/authController");
// can add functions from middleware folder as well
const express = require('express');
const router = express.Router();

//special router for signup and login
router.post('/signup', signup)
router.post('/login', login)
router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)
router.patch('/updateMyPassword', protect, updatePassword)
router.patch('/updateMe', protect, updateMe)
router.delete('/deleteMe', protect, deleteMe)

router.route('/').get(getAllUsers).post(createUser)
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser)

module.exports = router;