var mongoose = require('mongoose')
var Schema = mongoose.Schema

module.exports = mongoose.model('User', new Schema({
    account: String,
    password: String,
    admin: Boolean,
}))