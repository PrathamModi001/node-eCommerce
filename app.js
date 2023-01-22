const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  User.findById('63ca12c73689f7bcfe229ac8')
    .then(user => {
      req.user = user
      next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose.set('strictQuery', false);
mongoose
  .connect(
    // 'mongodb+srv://modii:pratham@mycluster.l92tp0u.mongodb.net/testDB?retryWrites=true&w=majority', { useNewUrlParser: true }
    "mongodb+srv://<username>:<password>@mycluster.l92tp0u.mongodb.net/testDB" , { useNewUrlParser: true }
  )
  .then(result => {
    User.findOne()
    .then(user => {
      if(!user){
        const user = new User({
          name : "Modi",
          email : "abc@123.com",
          cart : []
        });
        user.save();
      }
    })
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
