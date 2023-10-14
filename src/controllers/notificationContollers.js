const express = require('express');
const authMiddleware = require('../middleware/auth');
const Notification = require('../models/notification');
const router = express.Router();

// Rota para buscar notificações do usuário
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 }) // Ordenar por data de criação decrescente
      .exec();

    res.status(200).json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching notifications' });
  }
});
// Rota para marcar as notificações de comentários como lidas
router.put('/notifications/IsRead', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Marcar todas as notificações do usuário como lidas
    await Notification.updateMany({ user: userId }, { isRead: true });

    // Marcar também as notificações específicas de comentários como lidas
    await Notification.updateMany({ user: userId, content: /Commented your tweet/ }, { isRead: true });

    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while marking notifications as read' });
  }
});



module.exports = app => app.use(router);
