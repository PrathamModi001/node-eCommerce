const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const errorController = require('./controllers/error');
const sequelize = require("./util/database")
const Product = require("./models/product")
const User = require("./models/user")

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req,res,next) => {
    User.findByPk(1)
    .then((user) => {
        // By default ofc req.user is no such thing (but req.body is) and thus its empty/null. But we pass the sequelized obj user so that we can access its other attributes like id, name etc, AND other sequelized methods: destroy() create()
        req.user = user;
        next()
    })
    .catch((err) => {console.log(err)})
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);
// Associations

// When a User creates a Product. The Product belongs to the User. secondary args: constraints: true,
// onDelete: cascade means when we delete the entire User the data connected to with it: the products details also gets deleted thats what onDelete cascade does.
Product.belongsTo(User,{constraints: true , onDelete: "CASCADE"});

// the inverse of upar waale ka: a User can have many Product: so both the direction the relationship has been established.
User.hasMany(Product)

User.hasOne(Cart) // One to One Relation
Cart.belongsTo(User) // Inverse Relation 
// either of above relations will add another field to the table: userId to which the cart belongs.

Cart.belongsToMany(Product , {through: CartItem}) // Many to Many relation
Product.belongsToMany(Cart , {through: CartItem}) // This will only work if there is an intermediate table connecting them that stores the combination of ProductId and CartId which we have made to be cart-item


sequelize
.sync()
// .sync({force: true})

.then((result) => {
    return User.findByPk(1);
})

.then((user) => {
    if(!user){
        return User.create({
            name: "Pratham", email: "pratham123@gmail.com"
        })
    }
    return user;
})

.then((user) => {
    user.createCart();
}) 

.then((cart) => {
    app.listen(3000);
})

.catch((err) => {
    console.log(err)
})


