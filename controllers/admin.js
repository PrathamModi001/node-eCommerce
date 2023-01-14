const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  // since we associated 2 models: we can directly add a product through a particular user. A method called create____() depending on what you gave the name in the lines of association like Product.belongsTo() or User.hasMany(Product) the method createProduct() will be created in which we dont have to input attribute like userId

  // alternatively we can do Product.create({..... all methods....then... userId: req.user.Id})
  req.user.createProduct({ // called the magic association method
    title: title,
    description: description,
    imageUrl: imageUrl,
    price: price,
  })
  .then((result)=> {
    console.log(result)
    res.redirect("/admin/products")
  })
  .catch((err) => {
    console.log(err)
  })
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findByPk(prodId)
  .then((product) => {
    if (!product) {
      return res.redirect('/');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product: product,
      userId: req.user.userId
    });
  })
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;
  Product.findByPk(prodId)
    .then((product) => {
      product.title = updatedTitle;
      product.imageUrl = updatedImageUrl;
      product.description = updatedDesc;
      product.price = updatedPrice;
      return product.save();
    })
    .then((result) => {
      console.log("UPDATED!")
      res.redirect('/admin/products');
    })
    .catch(err => {console.log(err)})
};

exports.getProducts = (req, res, next) => {
  // we need all the products of the particular user
  req.user.getProducts() // another magic association method
    .then((products) => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {console.log(err)})
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findByPk(prodId)
    .then((product) => {
      return product.destroy()
    })
    .then((result) => {
      res.redirect('/admin/products');
    })
    .catch((err) => {console.log(err)});
};
