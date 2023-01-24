const User = require("../models/user")
const bcrypt = require("bcryptjs")
const saltRounds = 12;

exports.getLogin = (req, res, next) => {
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        isAuthenticated: false
    })
}

exports.getSignup = (req,res,next) => {
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        isAuthenticated: false
    })
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
        .then(user => {
            if(!user){
                console.log("PLEASE SIGN UP FIRST");
                return res.redirect("/signup")
            }
            bcrypt
            .compare(password , user.password)
            .then(doMatch => {
                if(doMatch){
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    // session.save is ot req all the time but here, writing into mongoDB might take a few seconds and the redirect will be done pehle than the writing into db.
                    return req.session.save(err => {
                        if(err => console.log(err))
                        res.redirect('/');
                    });
                }
                console.log("PASSWORDS DONT MATCH BHAI")
                return res.redirect("/login")
            })
        })
        .catch(err => console.log(err));
};

exports.postSignup = (req,res,next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    User.findOne({email : email})
        .then(userDoc => {
            if(userDoc){
                console.log("User Exists!");
                return res.redirect("/signup");
            }
            return bcrypt.hash(password,saltRounds)
                .then((encryptPass) => {
                    const user = new User({
                        email: email,
                        password: encryptPass,
                        cart: {items : []}
                    })
                    return user.save()
                })
                .then(result => {
                    res.redirect("/login")
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