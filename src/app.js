const express = require('express');
const app = express();
const db = require('./config/dbConnect');


db.on("error", console.log.bind(console, 'Erro de conexão'))
db.once("open", () => {
  console.log('conexão com o banco feita com sucesso')
})

app.use(express.json());
app.use(express.urlencoded({ extended: true }))


require('./controllers/projectController')(app);
require('./controllers/authController')(app);






module.exports = app