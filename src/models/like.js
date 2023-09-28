const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',// Referência ao modelo de dados User para associar o autor ao usuário
  },
  tweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
  },
});

module.exports = mongoose.model('Like', likeSchema);
