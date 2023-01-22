const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  userId : {
    // userId => refer to any _id => ref: "user" ===> now it refers to user db ka _id
    type : Schema.Types.ObjectId,  //mongoose.Schema.Types.ObjectId,
    ref : "user",
    required : true
  }
});

module.exports = mongoose.model('Product', productSchema);