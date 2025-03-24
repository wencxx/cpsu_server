const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: {
        type: String,
        unique: true
    },
    email: String,
    password: String,
    role: {
        type: String,
        default: 'user'
    }
})

module.exports = mongoose.model('User', userSchema)