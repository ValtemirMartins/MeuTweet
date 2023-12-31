const express = require('express');
const User = require('../models/user');
const Tweet = require('../models/tweet');
const Follow = require('../models/follow');
const Comment = require('../models/comment');
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

router.get('/tweets', authMiddleware, async (req, res) => {
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

      followedUserIds.push(loggedInUserId);

      tweets = await Tweet.find({ author: { $in: followedUserIds } })
        .sort({ createdAt: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage);
    }

    // Para cada tweet, busque os comentários associados
    const tweetsWithComments = await Promise.all(tweets.map(async (tweet) => {
      const comments = await Comment.find({ tweet: tweet._id })
        .populate('user', 'username');

      // Adicione os comentários ao tweet
      const tweetWithComments = tweet.toObject();
      tweetWithComments.comments = comments;

      return tweetWithComments;
    }));

    res.status(200).json({ tweets: tweetsWithComments });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao buscar tweets' });
  }
});

// Deletar um tweet pelo ID
router.delete('/tweets/:tweetId', authMiddleware, async (req, res) => {
  const loggedInUserId = req.userId;
  const tweetId = req.params.tweetId;

  try {
  
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    // Verifique se o usuário logado é o autor do tweet
    if (!tweet.author || tweet.author.toString() !== loggedInUserId) {
      return res.status(403).json({ error: 'You do not have permission to delete this tweet' });
    }

    await tweet.deleteOne();

    res.status(200).json({ message: 'Tweet deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the tweet' });
  }
});
// Atualizar um tweet pelo ID
router.put('/tweets/:tweetId', authMiddleware, async (req, res) => {
  const loggedInUserId = req.userId;
  const tweetId = req.params.tweetId;
  const { content } = req.body;

  try {
   
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }

    if (!tweet.author || tweet.author.toString() !== loggedInUserId) {
      return res.status(403).json({ error: 'You do not have permission to update this tweet' });
    }

    const currentTime = new Date();
    const tweetCreationTime = tweet.createdAt;
    const timeDifferenceMinutes = Math.floor((currentTime - tweetCreationTime) / (1000 * 60));

    if (timeDifferenceMinutes > 10) {
      return res.status(403).json({ error: 'You can only update tweets within 10 minutes of creation' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required to update the tweet' });
    }

    
    tweet.content = content;
    await tweet.save();

    res.status(200).json({ message: 'Tweet updated successfully', tweet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the tweet' });
  }
});



module.exports = app => app.use(router)
