const express = require('express');

const authController = require('../controllers/authController');

const { check } = require("express-validator/check")

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/signup',
    check('email')
        .isEmail()
        .withMessage('Please Enter a valid Email')
    , authController.getSignup);
router.post('/signup', authController.postSignup);

router.post('/logout', authController.postLogout);

router.get("/reset", authController.getReset);
router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword)
router.post("/reset/:token", authController.postNewPassword)


module.exports = router;