const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * User Schema
 */
let UserSchema = new mongoose.Schema({
   username: { type: String, unique: true, required: true },
   wallet: { type: Number, required: true },
   hash: { type: String, required: true },
   salt: { type: String, required: true }
});

UserSchema.methods.setPassword = function (password) {
   this.salt = crypto.randomBytes(32).toString('hex');
   this.hash = crypto.pbkdf2Sync(password, this.salt, 100, 64, 'sha512').toString('hex');
}

UserSchema.methods.validatePassword = function (password) {
   let hash = crypto.pbkdf2Sync(password, this.salt, 100, 64, 'sha512').toString('hex');
   return this.hash === hash;
}

module.exports = mongoose.model("User", UserSchema);
