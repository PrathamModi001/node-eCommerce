const Sequelize = require("sequelize")

const sequelize = require("../util/database")

// This is for a cart for each user. Like each user has one cart.
const Cart = sequelize.define("cart" , {
  id:{
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  }
})

module.exports = Cart;