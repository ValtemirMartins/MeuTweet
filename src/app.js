require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');

mongoose.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true,  useUnifiedTopology: true })
.then(() => {
  console.log('conexão com o banco feita com sucesso')
   app.emit('pronto');
})
.catch(e => console.log(e));

app.use(express.json());
app.use(express.urlencoded({ extended: true }))


require('./controllers/projectController')(app);
require('./controllers/authController')(app);




module.exports = app