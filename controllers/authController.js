const User = require("../models/user")
const bcrypt = require("bcryptjs")
const saltRounds = 12;
const nodemailer = require("nodemailer")
const sendgridTransport = require("nodemailer-sendgrid-transport")

const transporter = nodemailer.createTransport(sendgridTransport({
    auth : {
        api_key: process.env.API_KEY
    }
}))

exports.getLogin = (req, res, next) => {
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: req.flash('error') // via ejs show the flash via a key. so add errorMessage ejs syntax in views also
    })
}

exports.getSignup = (req, res, next) => {
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: req.flash('error')
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error', "Invalid Email!") // error is the key
                // in which page do we want to show them the message? the page they are on: Login page=> getLogin
                return res.redirect("/login") // send them again to the page they were on so they can try again 
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
                        req.flash('error', 'Invalid Password')
                        return res.redirect("/login")
                    }
                })
        })
        .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (password !== confirmPassword) {
        req.flash('error', "Passwords Don't Match!")
        return res.redirect("/signup")
    }
    User.findOne({ email: email })
        .then(userDoc => {
            if (userDoc) {
                req.flash('error', "User Exists!")
                return res.redirect("/signup");
            }
            return bcrypt.hash(password, saltRounds)
                .then((encryptPass) => {
                    const user = new User({
                        email: email,
                        password: encryptPass,
                        cart: { items: [] }
                    })
                    return user.save()
                })
                .then(result => {
                    res.redirect("/login")
                    return transporter.sendMail({
                        to: email,
                        from: 'prathammodi001@gmail.com',
                        subject: 'Singup Succeeded!',
                        html: '<h1>You have successfully signed up!</h1>'
                    })
                })
        })
        .catch(err => console.log(err))
}

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        res.redirect("/");
        console.log(err)
    })
}

// exports.getReset = (req,res,next) => {
//     res.render("auth/reset", {
//         path: "/reset",
//         pageTitle: "Reset",
//         errorMessage: req.flash('error')
//     })
// }