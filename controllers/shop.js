const Product = require('../models/product');
const Order = require("../models/order")

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(products => {
      res.render('shop/product-detail', {
        product: products[0],
        pageTitle: products[0].title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    // check userSchema. since we start from user and it has relationship with cart: we can do populate("cart")
    // populate("cart") will return the entire uppermost level entity ==> the entire user here.
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items;
      console.log(user.cart.items)
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteItemFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user.populate("cart.items.productId")
  .then(user => {
    const cartProduct = user.cart.items.map(i => {
      return {product: {... i.productId}, quantity: i.quantity}
    });
    const order = new Order({
      user: {
        name : req.user.name,
        userId : req.user._id
      },
      product : cartProduct
    });
    return order.save()
  })
  .then(result => {
    return req.user.clearCart()
  })
  .then(result => {
    return res.redirect("/orders")
  })
  .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({"user.userId" : req.user._id})
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};
