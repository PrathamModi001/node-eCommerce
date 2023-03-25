const express = require('express');

const authController = require('../controllers/authController');

const { check, body } = require('express-validator/check');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login', [
    body('email' , 'Please enter a valid email.')
        .isEmail()
        .withMessage('Please enter a valid email.'),
    body(
        'password',
        'Please enter a password with only numbers and text and at least 5 characters.'
    )
    .isLength({min:5})
    .isAlphanumeric()
], authController.postLogin);

router.get('/signup', authController.getSignup);
router.post('/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom((value, { req }) => {
                return User.findOne({ email: value }).then(userDoc => {
                    if (userDoc) {
                        return Promise.reject(
                            'E-Mail exists already, please pick a different one.'
                        );
                    }
                });
            }),
        body(
            'password',
            'Please enter a password with only numbers and text and at least 5 characters.'
        )
            .isLength({ min: 5 })
            .isAlphanumeric(),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords have to match!');
            }
            return true;
        })
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get("/reset", authController.getReset);
router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword)
router.post("/reset/:token", authController.postNewPassword)


module.exports = router;