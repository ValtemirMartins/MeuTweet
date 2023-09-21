const express = require('express');
const User = require('../models/user');
const Follow = require('../models/follow');
const Tweet = require('../models/tweet');
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
// Deletar o perfil do usuário logado
router.delete('/delete', authMiddleware, async (req, res) => {
  const loggedInUserId = req.userId;

  try {
    const loggedInUser = await User.findById(loggedInUserId);

    if (!loggedInUser) {
      return res.status(404).json({ error: 'Logged-in user not found' });
    }
    await Tweet.deleteMany({ author: loggedInUserId }); // Deleta todos os tweets do usuário

    await Follow.deleteMany({ follower: loggedInUserId }); // Deixa de seguir todos os outros usuários

    await Follow.deleteMany({ following: loggedInUserId }); // Deixa de ser seguido por outros usuários

    await User.deleteOne({ _id: loggedInUserId });


    res.status(200).json({ message: 'Your profile has been deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while deleting the profile' });
  }
});
// Atualizar o perfil do usuário logado
router.put('/update', authMiddleware, async (req, res) => {
  const loggedInUserId = req.userId;
  const { username, password, name, surname } = req.body;

  try {
    // Verifique se o usuário logado está tentando atualizar seu próprio perfil
    const loggedInUser = await User.findById(loggedInUserId);

    if (!loggedInUser) {
      return res.status(404).json({ error: 'Logged-in user not found' });
    }

    // Verifique se o nome de usuário está sendo alterado para um que já existe (2.A)
    if (username && username !== loggedInUser.username) {
      const existingUser = await User.findOne({ username });

      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }
    // Atualize os campos do perfil, se fornecidos
    if (username) {
      loggedInUser.username = username;
    }
    if (password) {
      loggedInUser.password = password; 
    }
    if (name) {
      loggedInUser.name = name;
    }
    if (surname) {
      loggedInUser.surname = surname;
    }

    await loggedInUser.save();

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the profile' });
  }
});
//Buscar informações do perfil do usuário logado
router.get('/profile', authMiddleware, async (req, res) => {
  const loggedInUserId = req.userId;

  try {
    // Busque as informações do usuário logado
    const loggedInUser = await User.findById(loggedInUserId);

    if (!loggedInUser) {
      return res.status(404).json({ error: 'Logged-in user not found' });
    }

    // Busque o número de seguidores do usuário logado
    const followersCount = await Follow.countDocuments({ following: loggedInUserId });

    // Busque o número de pessoas que o usuário logado segue
    const followingCount = await Follow.countDocuments({ follower: loggedInUserId });

    // Crie um objeto de resposta com as informações do perfil
    const userProfile = {
      name: loggedInUser.name,
      surname: loggedInUser.surname,
      followers: followersCount,
      following: followingCount,
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching user profile' });
  }
});

// buscar informações do perfil de outro usuário
router.get('/user/:username', authMiddleware, async (req, res) => {
  const { username } = req.params;

  try {
    
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Busque o número de seguidores do usuário
    const followersCount = await Follow.countDocuments({ following: user._id });

    // Busque o número de pessoas que o usuário segue
    const followingCount = await Follow.countDocuments({ follower: user._id });

    // Crie um objeto de resposta com as informações do perfil do usuário
    const userProfile = {
      name: user.name,
      surname: user.surname,
      followers: followersCount,
      following: followingCount,
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching user profile' });
  }
});


module.exports = app => app.use('/auth', router)
