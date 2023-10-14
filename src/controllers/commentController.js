const express = require('express');
const Comment = require('../models/comment');
const User = require('../models/user'); // Importe o modelo de usuário
const Tweet = require('../models/tweet');
const Notification = require('../models/notification');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Rota para criar um comentário em um tweet e notificar o autor do tweet
router.post('/tweets/:tweetId/comments', authMiddleware, async (req, res) => {
  try {
    const { tweetId } = req.params;
    const userId = req.userId;
    const { text } = req.body;

    // Criando um novo comentário
    const newComment = new Comment({
      tweet: tweetId,
      user: userId,
      text,
    });

    await newComment.save();

    // Buscar informações do usuário que está comentando
    const user = await User.findById(userId, 'id name surname');

    // Buscar o tweet para obter o autor do tweet
    const tweet = await Tweet.findById(tweetId);

    // Verificar se o autor do tweet não é o mesmo que fez o comentário
    if (tweet.author.toString() !== userId) {
      const notificationContent = `${user.name} Commented your tweet: "${tweet.content}"`;
      
      // Criar uma notificação para o autor do tweet
      const newNotification = new Notification({
        user: tweet.author,
        content: notificationContent,
      });

      await newNotification.save();
    }

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

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Verifique se o usuário é o autor do comentário ou um administrador
    if (comment.user.toString() !== userId) {
      return res.status(403).json({ error: 'You do not have permission to edit this comment' });
    }

    const minutelimits = (new Date() - comment.createdAt) / (1000 * 60);
    if (minutelimits > 5) {
      return res.status(400).json({ error: 'Timed out, you can no longer edit this comment' });
    }

    comment.text = text;
    await comment.save();

    res.status(200).json({ message: 'Comment edited successfully', comment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error editing comment' });
  }
});


module.exports = app => app.use(router);
