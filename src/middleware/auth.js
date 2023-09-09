const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.json');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const parts = authHeader.split(' ');

    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      const token = parts[1];

      jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err) {
          return res.status(401).send({ error: 'Token inválido' });
        }

        req.userId = decoded.id;
        console.log(decoded);
        return next();
      });
    } else {
      return res.status(401).send({ error: 'Token mal formatado' });
    }
  } else {
    next();
  }
};
