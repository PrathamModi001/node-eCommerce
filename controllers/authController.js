const User = require("../models/user")

exports.getLogin = (req, res, next) => {
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        isAuthenticated: false
    })
}

exports.postLogin = (req, res, next) => {
    User.findById('63cd3ee03da81ad8613cb195')
        .then(user => {
            req.session.isLoggedIn = true;
            req.session.user = user;

            // session.save is ot req all the time but here, writing into mongoDB might take a few seconds and the redirect will be done pehle than the writing into db.
            req.session.save(err => {
                console.log(err);
                res.redirect('/');
            });
        })
        .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        res.redirect("/");
        console.log(err)
    })
}