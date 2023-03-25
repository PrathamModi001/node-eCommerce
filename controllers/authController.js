const User = require("../models/user")
const bcrypt = require("bcryptjs")
const saltRounds = 12;
const nodemailer = require("nodemailer")
const crypto = require("crypto")
const { validationResult } = require('express-validator/check')

const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: 'prathammodi3001@outlook.com',
        pass: process.env.GMAIL_PASS
    }
})

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: req.flash('error'),
        oldInput: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    })
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("auth/signup", {
            path: "/signup",
            pageTitle: "Signup",
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password, confirmPassword: req.body.confirmPassword },
            validationErrors: errors.array()
        });
    }

    if (password !== confirmPassword) {
        req.flash('error', "Passwords Don't Match!")
        return res.redirect("/signup")
    }
    // added this in validation part
    // User.findOne({ email: email })
    //     .then(userDoc => {
    //         if (userDoc) {
    //             req.flash('error', "User Exists!")
    //             return res.redirect("/signup");
    //         }
    //return
    bcrypt.hash(password, saltRounds)
        .then((encryptPass) => {
            const user = new User({
                email: email,
                password: encryptPass,
                cart: { items: [] }
            })
            return user.save()
        })
        .then(result => {
            var mailOptions = {
                from: 'prathammodi3001@outlook.com',
                to: email,
                subject: 'Signup Succeeded',
                text: `You Successfully Signed up ! Yay !`
            };
            res.redirect("/login")
            transporter.sendMail(mailOptions, (err, info) => {
                if (err => console.log(err))
                    console.log("Email Sent Successfully !", info.res)
            })
        })
        .catch(err => console.log(err))
}

exports.getLogin = (req, res, next) => {
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: req.flash('error'), // via ejs show the flash via a key. so add errorMessage ejs syntax in views also
        oldInput: { email: '', password: '' },
        validationErrors: []
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password },
            validationErrors: errors.array()
        });
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid Email',
                    oldInput: { email: email, password: password },
                    validationErrors: [{ param: 'email', param: 'password' }] // if you dont wanna show whats wrong email or pass. dont give any value just [].
                });
            }
            bcrypt
                .compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        // session.save is ot req all the time but here, writing into mongoDB might take a few seconds and the redirect will be done pehle than the writing into db.
                        return req.session.save(err => {
                            if (err => console.log(err))
                                res.redirect('/');
                        });
                    }
                    else {
                        return res.status(422).render('auth/login', {
                            path: '/login',
                            pageTitle: 'Login',
                            errorMessage: 'Password Incorrect', // should show that pass wrong but ok
                            oldInput: { email: email, password: password },
                            validationErrors: [{ param: 'email', param: 'password' }] // if you dont wanna show whats wrong email or pass dont give any value just [].
                        });
                    }
                })
        })
        .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        res.redirect("/");
        console.log(err)
    })
}

exports.getReset = (req, res, next) => {
    res.render("auth/reset", {
        path: "/reset",
        pageTitle: "Reset",
        errorMessage: req.flash('error')
    })
}

// for getting a token to change password only through a particular link.
exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect("/reset");
        }
        const token = buffer.toString('hex')
        User.findOne({ email: req.body.email })
            .then(userFound => {
                if (!userFound) {
                    req.flash('error', 'No account found with that email!')
                    return res.redirect("/reset")
                }
                // a user found with that email
                userFound.resetToken = token;
                userFound.resetTokenExpiration = Date.now() + 3600000; // an hour from now
                return userFound.save()
            })
            .then(result => {
                var mailOptions = {
                    from: 'prathammodi3001@outlook.com',
                    to: req.body.email,
                    subject: 'Reset Password!',
                    html: `
                    <p>You requested a password reset</p>
                    <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                    `
                };
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err => console.log(err))
                        console.log("Email Sent Successfully !")
                })
                res.redirect("/")
            })
            .catch(err => console.log(err))
    })
}

exports.getNewPassword = (req, res, next) => {

    const token = req.params.token
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(userFound => {
            if (!userFound) {
                req.flash('error', 'Please try to reset password again!!')
                res.redirect("/reset")
            }
            // user with the correct resetToken found: 
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render("auth/new-reset-password", {
                path: "/new-password/",
                pageTitle: "New Password",
                errorMessage: req.flash('error'),
                userId: userFound._id.toString(),
                token: token
            })
        })
        .catch(err => console.log(err))
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId
    const token = req.params.token;

    let user; // so that the userFound can be used in the entire scope.
    let email;

    User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
        .then(userFound => {
            user = userFound;
            email = userFound.email
            return bcrypt.hash(newPassword, saltRounds)
        })
        .then((encryptPass) => {
            user.password = encryptPass;
            user.resetToken = undefined;
            user.resetTokenExpiration = undefined;
            return user.save()
        })
        .then(result => {
            var mailOptions = {
                from: 'prathammodi3001@outlook.com',
                to: email,
                subject: 'Password Changed Successfully!',
                html: `
                <p>You have successfully changed the password !</p>
                `
            };
            transporter.sendMail(mailOptions, (err, info) => {
                if (err => console.log(err))
                    console.log("Email Sent Successfully !")
            })
            res.redirect("/")
        })
        .catch(err => console.log(err))
}