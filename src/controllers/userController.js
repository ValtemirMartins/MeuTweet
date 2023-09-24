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

router.get('/users', async (req, res) => {
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
router.delete('/users', authMiddleware, async (req, res) => {
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
router.patch('/users', authMiddleware, async (req, res) => {
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
router.get('/users/:userId', authMiddleware, async (req, res) => {
  const loggedInUserId = req.userId;
  const requestedUserId = req.params.userId;

  try {
    // Busque as informações do usuário logado
    const loggedInUser = await User.findById(loggedInUserId);

    if (!loggedInUser) {
      return res.status(404).json({ error: 'Logged-in user not found' });
    }

    // Busque o usuário solicitado
    const requestedUser = await User.findById(requestedUserId);

    if (!requestedUser) {
      return res.status(404).json({ error: 'Requested user not found' });
    }

    // Busque o número de seguidores do usuário logado
    const followers = await Follow.find({ following: loggedInUserId }).populate('follower', 'name surname');

    // Busque o número de pessoas que o usuário logado segue
    const following = await Follow.find({ follower: loggedInUserId }).populate('following', 'name surname');

    // Crie um objeto de resposta com as informações do perfil
    const userProfile = {
      name: requestedUser.name,
      surname: requestedUser.surname,
      followers: followers.map(follower => ({
        name: follower.follower.name,
        surname: follower.follower.surname,
      })),
      following: following.map(user => ({ 
        name: user.following.name, 
        surname: user.following.surname })),
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching user profile' });
  }
});

// Rota para buscar informações do perfil de outro usuário
router.get('/user/:username', authMiddleware, async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Busque os usuários que o usuário segue
    const followingUsers = await Follow.find({ follower: user._id }).populate('following', 'name surname');

    // Crie um objeto de resposta com as informações do perfil do usuário e os detalhes dos usuários que ele segue
    const userProfile = {
      name: user.name,
      surname: user.surname,
      following: followingUsers.map(follow => ({
        name: follow.following.name,
        surname: follow.following.surname,
      })),
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching user profile' });
  }
});


module.exports = app => app.use('/auth', router)