const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const ITEMS_PER_PAGE = 1;

const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(numProducts => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then(totalProds => {
      totalItems = totalProds;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
      });
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    });
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
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    });
};

exports.getCheckout = (req, res, next) => {
  let total=0;
  let products;
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      products = user.cart.items;
      total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });

      // configuring stripe checkout session
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(product => {
          // returning a product from the products while config its properties
          return {
            name: product.productId.title,
            description: product.productId.description,
            amount: product.productId.price,
            currency: 'INR',
            quantity: p.quantity,
          }
        }),
        // https   + :// +   localhost:3000 or whatever hosting you do + actual route
        success_url: req.protocol +'://' + req.get('host') + '/checkout/success' ,
        cancel_url: req.protocol +'://' + req.get('host') + '/checkout/cancel'
      });
    })
    // stripe session recieved
    .then(session => {
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: session.id
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch(err => {
      const error = new Error(err)
      error.httpStatusCode = 500;
      return next(error)
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  const invoiceName = 'invoice-' + orderId + '.pdf'
  const invoiceFilePath = path.join('data', 'invoices', invoiceName);


  Order.findById(orderId)
    .then(order => {
      // if no order found by that id
      if (!order) {
        return next(new Error('No Order Found!'))
      }
      // if order found but not matching user ids, user unauthorized error throw
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error('User Unauthorized!'))
      }

      const pdfDoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
      pdfDoc.pipe(fs.createWriteStream(invoiceFilePath));
      pdfDoc.pipe(res);

      pdfDoc.fontSize(26).text('Invoice', {
        underline: true
      });
      pdfDoc.text('-----------------------');
      let totalPrice = 0;
      order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
            ' - ' +
            prod.quantity +
            ' x ' +
            '$' +
            prod.product.price
          );
      });
      pdfDoc.text('---');
      pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

      pdfDoc.end();

    })
    .catch(err => {
      return next(err);
    });
}
  // FOR READING THE FILE CODE

  // with this code node will read the entire code and store it in memory and then serve from memory which for bigger files may overflow
  // fs.readFile(invoiceFilePath, (err, data) => {
  //   if (err) {
  //     return next()
  //   }
  //   res.setHeader('Content-Type', 'application/pdf');
  //   res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
  //   res.send(data)
  // })

  // // so we should stream the data
  // const file = fs.createReadStream(invoiceFilePath);
  // res.setHeader('Content-Type', 'application/pdf');
  // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
  // // forward the data that is read while streaming in chunks TO the res because res is writable stream and file here is readStream
  // file.pipe(res)