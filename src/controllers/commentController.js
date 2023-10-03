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

// Rota para editar um comentário
router.put('/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;
    const { text } = req.body;

    // Encontre o comentário pelo ID
    const comment = await Comment.findById(commentId);

    // Verifique se o usuário é o autor do comentário ou um administrador
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para editar este comentário' });
    }

    // Verifique se o comentário foi feito nos últimos 5 minutos
    const minutosPassados = (new Date() - comment.createdAt) / (1000 * 60);
    if (minutosPassados > 5) {
      return res.status(400).json({ error: 'Você não pode mais editar este comentário' });
    }

    // Atualize o texto do comentário
    comment.text = text;
    await comment.save();

    res.status(200).json({ message: 'Comentário editado com sucesso', comment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao editar comentário' });
  }
});


module.exports = app => app.use(router);
