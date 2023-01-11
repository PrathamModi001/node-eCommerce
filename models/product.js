const Sequelize = require("sequelize")
const sequelize = require("../util/database")

const Product = sequelize.define("product" , {
  id: {
    allowNull: false,
    primaryKey: true,
    type: Sequelize.INTEGER,
    autoIncrement: true
  } ,
  description: {
    type: Sequelize.STRING,
    allowNull: false
  } , 
  imageUrl: {
    type: Sequelize.STRING,
    allowNull: false
  } ,
  price: { 
    type: Sequelize.STRING,
    allowNull: false
  } , 
  title: {
    type:Sequelize.STRING,
    allowNull: false
  }
  
})

module.exports = Product 