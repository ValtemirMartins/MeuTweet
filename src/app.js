require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
// const authController = require('./controllers/authController');
// const userController = require('./controllers/userController');
// const tweetController = require('./controllers/tweetController');

mongoose.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true,  useUnifiedTopology: true })
.then(() => {
  console.log('Connection to the bank made successfully')
   app.emit('pronto');
})
.catch(e => console.log(e));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

//require('./controllers/projectController')(app);
require('./controllers/authController')(app);
require('./controllers/userController')(app);
require('./controllers/tweetController')(app);

// app.use(authController);
// app.use(userController);
// app.use(tweetController);

module.exports = app