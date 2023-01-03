const products = []

module.exports = class Product{
    constructor (t){
        this.title = t;
    }

    save(){
        products.push(this)
    }

    // static so that we can directly use this method ad NOT create some dummy object of class
    // Product("dummy"). But we can directly do const product = Product.fetchAll();
    static fetchAll(){
        return products
    }
}