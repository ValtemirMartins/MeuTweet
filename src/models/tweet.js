const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referência ao modelo de dados User para associar o autor ao usuário
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 280, // Defina o limite máximo de caracteres para o conteúdo do tweet
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  likeCount: {
    type: Number,
    default: 0, // Inicia com 0 curtidas
  },
});


module.exports = mongoose.model('Tweet', tweetSchema);


