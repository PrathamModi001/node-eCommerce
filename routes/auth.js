const express = require('express');

const authController = require('../controllers/authController');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', authController.postLogin);

router.post('/signup', authController.postSignup);

router.post('/logout', authController.postLogout);

router.get("/reset" , authController.getReset);

router.post("/reset" , authController.postRest);
module.exports = router;