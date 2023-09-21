const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  name: {
    type: String,
    required: true, 
  },
  surname: {
    type: String,
    required: true, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});


UserSchema.pre('save', async function(next){
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;

  next()
})

const User = mongoose.model('User', UserSchema);

module.exports = User;