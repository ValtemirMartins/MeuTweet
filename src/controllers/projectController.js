const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/projeto', (req, res) => {
  res.send({Ok: true });
});

module.exports = app => app.use('/auth', router)