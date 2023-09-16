const express = require('express');
const User = require('../models/user');
const Tweet = require('../models/tweet');
const Follow = require('../models/follow');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Crie um tweet
router.post('/tweets', authMiddleware, async (req, res) => {
  const { content } = req.body;
  const loggedInUserId = req.userId;

  try {
    const loggedInUserObj = await User.findById(loggedInUserId);

    if (!loggedInUserObj) {
      return res.status(404).json({ error: 'Logged-in user not found' });
    }

    const tweet = new Tweet({
      author: loggedInUserObj._id,
      content: content,
    });

    await tweet.save();

    res.status(200).json({ message: 'Tweet created successfully', tweet });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while creating your tweet' });
  }
});

// Listar tweets
router.get('/tweets/list', async (req, res) => {
  const loggedInUserId = req.userId;
  const page = req.query.page || 1;
  const itemsPerPage = 30;
  const tweetType = req.query.type || 'all';

  try {
    let tweets;

    if (tweetType === 'all') {
      tweets = await Tweet.find({})
        .sort({ createdAt: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    } else if (tweetType === 'following') {
      const followedUsers = await Follow.find({ follower: loggedInUserId }).select('following');
      const followedUserIds = followedUsers.map(user => user.following);

      followedUserIds.push(loggedInUserId); // Adicione o ID do usuário logado para incluir seus próprios tweets.

      tweets = await Tweet.find({ author: { $in: followedUserIds } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    }

    res.status(200).json({ tweets });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao buscar tweets' });
  }
});



module.exports = app => app.use('/auth', router)
