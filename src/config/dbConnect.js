const mongoose = require('mongoose')

mongoose.connect(
  "mongodb+srv://valmartinsfilho:271210@meutweet.qfpb4e9.mongodb.net/?retryWrites=true&w=majority");
  let db = mongoose.connection;

  module.exports = db