const mongoose = require('mongoose');

/**
 * Task Schema
 */
let ObjectId = mongoose.Schema.Types.ObjectId;

let TaskUserSchema = new mongoose.Schema({
   id: { required: true, type: ObjectId },
   name: { required: true, type: String }
});

let TaskSchema = new mongoose.Schema({
   name: { required: true, type: String },
   description: { required: true, type: String },
   priority: { required: true, type: Number },
   payout: { required: true, type: Number },
   completed: { required: true, type: Boolean },
   creationDate: { required: true, type: Date },
   owner: { type: Object, of: TaskUserSchema, required: true },
   claimer: { type: Object, of: TaskUserSchema }
});

module.exports = mongoose.model("Task", TaskSchema);