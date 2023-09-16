const express = require('express');
const User = require('../models/user');
const Follow = require('../models/follow');
const authMiddleware = require('../middleware/auth')
const router = express.Router();


//Seguir um usuário
router.post('/follow', authMiddleware, async (req, res) => {
  const { username } = req.body;
  const loggedInUserId = req.userId;

  try {
    const userToFollow = await User.findOne({ username });

    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const loggedInUserObj = await User.findById(loggedInUserId);

    if (!loggedInUserObj) {
      return res.status(404).json({ error: 'Logged-in user not found' });
    }

    const alreadyFollowing = await Follow.findOne({
      follower: loggedInUserObj._id,
      following: userToFollow._id,
    });

    if (alreadyFollowing) {
      return res.status(400).json({ error: 'You are already following this user' });
    }

    const follow = new Follow({
      follower: loggedInUserObj._id,
      following: userToFollow._id,
    });

    await follow.save();
    res.status(200).json({ message: `You are now following ${userToFollow.username}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

// Deixar de seguir um usuário
router.delete('/unfollow', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    const loggedInUserId = req.userId;

    const userToUnfollow = await User.findOne({ username });

    if (!userToUnfollow) {
      return res.status(404).send({ error: 'User not found' });
    }

    const userUnfollowed = await Follow.findOneAndDelete({
      follower: loggedInUserId,
      following: userToUnfollow._id,
    });

    if (!userUnfollowed) {
      return res.status(400).send({ error: 'You were not following this user' });
    }

    res.status(200).send({ message: 'You have unfollowed the user' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Error unfollowing user' });
  }
});


router.get('/users', authMiddleware, async (req, res) => {
  const { name } = req.query;

  try {
    let foundUsers;

    if (name) {
      foundUsers = await User.find({ username: { $regex: new RegExp(name, 'i') } })
        .sort({ username: 1 });
    } else {
      foundUsers = await User.find({})
        .sort({ username: 1 });
    }

    res.status(200).json({ users: foundUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while searching or listing users' });
  }
});

module.exports = app => app.use('/auth', router)
