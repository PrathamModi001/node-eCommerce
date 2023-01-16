const Sequelize = require("sequelize")

const sequelize = require("../util/database")

// This is for a cart containing products, number of prods and all. So this cart will have multiple products.
const OrderItems = sequelize.define("orderItem", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    quantity: Sequelize.INTEGER,
    // we'll not add which product and all we will allow sequelize to manage all that by creating associations.
})

module.exports = OrderItems;