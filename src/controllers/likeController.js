const express = require('express');
const User = require('../models/user');
const Tweet = require('../models/tweet');
const Like = require('../models/like');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Rota para curtir um tweet
router.post('/tweets/:tweetId/like', authMiddleware, async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.userId; // ID do usuário que está curtindo o tweet

  try {
    // Verificar se o tweet existe
    const existingTweet = await Tweet.findById(tweetId);

    if (!existingTweet) {
      return res.status(404).json({ message: 'Tweet not found' });
    }

    // Verificar se o usuário já curtiu o tweet
    const existingLike = await Like.findOne({ 
      tweet: existingTweet._id, // Usamos o ID do tweet existente
      user: userId
    });
    console.log(tweetId, userId)

    if (existingLike) {
      return res.status(400).json({ message: 'You have already liked this tweet' });
    }

    //Criando uma curtida com o ID do tweet existente e do usuário que está curtindo
    const like = new Like({ 
      tweet: existingTweet._id, // ID do tweet existente
      user:userId
    });
    console.log(tweetId, userId)

    await like.save();

    existingTweet.likeCount += 1;
    await existingTweet.save();
    
    res.status(200).json({ message: 'Tweet liked successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
});

// Rota para listar todos os tweets que um usuário curtiu
router.get('/users/:userId/liked-tweets', authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    // Verificar se o usuário existe
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Buscar os likes do usuário
    const userLikes = await Like.find({ user: userId }).populate('tweet');

    // Extrair a lista de tweets dos likes
    const tweets = userLikes.map(like => like.tweet);

    res.status(200).json(tweets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
});


module.exports = app => app.use('/auth', router);
