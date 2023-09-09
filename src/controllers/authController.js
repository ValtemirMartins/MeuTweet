const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.json')
const User = require('../models/user');
const Seguir = require('../models/seguir');
const Tweet = require('../models/tweet');
const router = express.Router();


function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });

}

router.post('/usuarios/registro', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existeUser = await User.findOne({ username });

    if (existeUser) {
      return res.status(400).send({ error: 'Nome de usuario ja Cadastrado' });
    }

    if (password.length < 8) {
      return res.status(400).send({ error: 'A senha deve conter pelo menos 8 caracteres' });
    }

    const user = await User.create({ username, password });

    user.password = undefined;

    return res.send({
      user,
      token: generateToken({ id: user.id }),

    });


  } catch (err) {
    return res.status(400).send({ error: 'Falla ao Cadastrar usuario' });
  }
});

router.post('/usuarios/autenticar', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select('+password');
  console.log(user)

  if (!user)
    return res.status(400).send({ error: 'Usuario não encontrado' });

  if (!await bcrypt.compare(password, user.password))
    return res.status(400).send({ error: 'Senha Invalida' });

  user.password = undefined;

  res.send({
    user,
    token: generateToken({ id: user.id }),

  });
});

router.post('/usuarios/seguir', async (req, res) => {
  const { username } = req.body;
  const usuarioLogado = req.userId;

  try {
    const userASeguir = await User.findOne({ username });
    console.log(userASeguir);

    if (!userASeguir) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const usuarioLogadoObj = await User.findById(usuarioLogado);

    if (!usuarioLogadoObj) {
      return res.status(404).json({ error: 'Usuário logado não encontrado' });
    }

    const jaSegue = await Seguir.findOne({
      seguidor: usuarioLogadoObj._id,
      seguindo: userASeguir._id,
    });

    if (jaSegue) {
      return res.status(400).json({ error: 'Você já está seguindo este usuário' });
    }

    const seguir = new Seguir({
      seguidor: usuarioLogadoObj._id,
      seguindo: userASeguir._id,
    });

    await seguir.save();
    res.status(200).json({ message: `Agora você está seguindo ${userASeguir.username}` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao processar a solicitação' });
  }
});
router.post('/usuarios/deixar-de-seguir', async (req, res) => {

  try {
    const { username } = req.body;
    const idUsuarioLogado = req.userId;

    const usuarioDeixarDeSeguir = await User.findOne({ username });
    console.log(usuarioDeixarDeSeguir)

    if (!usuarioDeixarDeSeguir) {
      return res.status(404).send({ error: 'Usuário não encontrado' });
    }

    const userSeguido = await Seguir.findOneAndDelete({
      seguidor: idUsuarioLogado,
      seguindo: usuarioDeixarDeSeguir._id,
    });

    if (!userSeguido) {
      return res.status(400).send({ error: 'Você não estava seguindo este usuário' });
    }

    res.status(200).send({ message: 'Você deixou de seguir o usuário' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Erro ao deixar de seguir usuário' });
  }
});

router.post('/tweets/criar', async (req, res) => {
  const { conteudo } = req.body;
  const usuarioLogado = req.userId;

  try {
    const usuarioLogadoObj = await User.findById(usuarioLogado);

    if (!usuarioLogadoObj) {
      return res.status(404).json({ error: 'Usuário logado não encontrado' });
    }

    const tweet = new Tweet({
      autor: usuarioLogadoObj._id,
      conteudo: conteudo,
    });

    await tweet.save();

    res.status(200).json({ message: 'Tweet criado com sucesso', tweet });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao criar seu tweet' });
  }
});
router.get('/tweets/listar', async (req, res) => {
  const usuarioLogado = req.userId;
  const pagina = req.query.pagina || 1;
  const limitePorPagina = 30;
  const tipoTweets = req.query.tipo || 'todos'; 

  try {
    let tweets;

    if (tipoTweets === 'todos') {
      // Busque todos os tweets
      tweets = await Tweet.find({})
        .sort({ dataHoraCriacao: -1 }) 
        .skip((pagina - 1) * limitePorPagina)
        .limit(limitePorPagina);

    } else if (tipoTweets === 'seguidos') {
      // Encontre os IDs dos usuários que o usuário logado está seguindo
      const usuariosSeguidos = await Seguir.find({ seguidor: usuarioLogado }).select('seguindo');

      // Crie uma nova matriz com os IDs dos usuários seguidos
      const usuariosSeguidosIds = usuariosSeguidos.map(usuario => usuario.seguindo);

      // Buscar tweets do usuário logado e dos usuários seguidos
      const tweetsDoUsuario = await Tweet.find({ autor: usuarioLogado })
        .sort({ dataHoraCriacao: -1 }) 
        .skip((pagina - 1) * limitePorPagina)
        .limit(limitePorPagina);

      const tweetsDosSeguidos = await Tweet.find({ autor: { $in: usuariosSeguidosIds } })
        .sort({ dataHoraCriacao: -1 }) 
        .skip((pagina - 1) * limitePorPagina)
        .limit(limitePorPagina);

      tweets = [...tweetsDoUsuario, ...tweetsDosSeguidos].sort((a, b) => b.dataHoraCriacao - a.dataHoraCriacao);
    }

    res.status(200).json({ tweets });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro na busca pelos tweets' });
  }
});

router.get('/usuarios/buscar', async (req, res) => {
  const { nome } = req.query;

  try {
    let usuariosEncontrados;

    if (nome) {
      // busca usuários por nome
      usuariosEncontrados = await User.find({ username: { $regex: new RegExp(nome, 'i') } })
        .sort({ username: 1 }); 
    } else {
      
      usuariosEncontrados = await User.find({})
        .sort({ username: 1 }); 
    }

    res.status(200).json({ usuarios: usuariosEncontrados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocorreu um erro ao buscar ou listar usuários' });
  }
});

module.exports = app => app.use('/auth', router);
