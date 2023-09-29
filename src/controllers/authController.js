const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.json');
const User = require('../models/user');
//const authMiddleware = require('../middleware/auth');
const router = express.Router();

//router.use(authMiddleware);


function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
}

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, surname } = req.body;

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).send({ error: 'Username already registered' });
    }

    if (password.length < 8) {
      return res.status(400).send({ error: 'Password must be at least 8 characters long' });
    }

    const user = await User.create({
      username,
      password,
      name, 
      surname, 
    });

    user.password = undefined;

    return res.send({
      user,
      token: generateToken({ id: user.id }),
    });
  } catch (err) {
    return res.status(400).send({ error: 'Failed to register user' });
  }
});

// Autenticar um usuário
router.post('/authenticate', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select('+password');

  if (!user)
    return res.status(400).send({ error: 'User not found' });

  if (!await bcrypt.compare(password, user.password))
    return res.status(400).send({ error: 'Invalid password' });

  user.password = undefined;

  res.send({
    user,
    token: generateToken({ id: user.id }),
  });
});

module.exports = app => app.use(router)
