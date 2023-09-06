const mongoose = require('mongoose');

const seguirSchema = new mongoose.Schema({
 seguidor: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
 },

 seguindo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
 },

});

module.exports = mongoose.model('Seguir', seguirSchema);
