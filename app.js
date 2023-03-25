require("dotenv").config()

const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
var csrf = require('@dr.pogodin/csurf')
const flash = require('connect-flash')

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = process.env.MONGO_DB_URI;

const app = express();
// session INITIATE
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'mySessions'
});

// csrf protection and flash after sessions been initiated.
let csrfProtection = csrf();
app.use(flash())

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);

// after initiating the session we'll make use of the protection:
app.use(csrfProtection)

// initializing the session
app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => {
      // note that inside async code like then catch we MUST use next(new Error(err)) to reach the designated global error status code wise errors not JUST new Error(err)
      next(new Error(err))
    })
});

// before accessing all routes, since want to PASS ON THESE LOCAL VARIABLES TO ALL VIEWS
app.use((req,res,next) => {
  // app.render("ALL VIEWS" , {isAuthenticated: req.session.isLoggedIn, csrfToken: req.csrfToken()})
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken(); // csrfToken() is a method name: csrfToken has to be the "value" field in views
  // basically every FORM will need the name="_csrf" value="csrfToken"
  next();
})

// routes
app.use('/admin', adminRoutes); // /admin added before all adminRoutes=> /admin/add-product
app.use(shopRoutes);
app.use(authRoutes);

// any routes not handled by above and has a error code of 500 comes here.
app.get('/500', errorController.get500);

// if a route doesnt fall in any of the above routes: then show 404 page: 
app.use(errorController.get404);

// for error handling
app.use((error, req,res,next) => {
  res.redirect('/500')
})

mongoose
  .connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
