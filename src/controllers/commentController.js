const express = require('express');
const Comment = require('../models/comment');
const User = require('../models/user'); // Importe o modelo de usuário
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Comentar um tweet e retornar o id, name e surname do usuário que está comentando
router.post('/tweets/:tweetId/comments', authMiddleware, async (req, res) => {
  try {
    const { tweetId } = req.params;
    const userId = req.userId;
    const { text } = req.body;

    // Criar um novo comentário
    const newComment = new Comment({
      tweet: tweetId,
      user: userId,
      text,
    });

    // Salvar o comentário no banco de dados
    await newComment.save();

    // Buscar informações do usuário que está comentando
    const user = await User.findById(userId, 'id name surname');

    res.status(201).json({ message: 'Comment created successfully', comment: newComment, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating comment' });
  }
});

module.exports = app => app.use(router);
