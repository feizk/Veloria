const { Schema, model } = require("mongoose");

const User = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },

  guild: {
    type: String,
    required: true,
    unique: true,
  },

  whitelisted: {
    type: Boolean,
    required: false,
    default: false,
  },

  trivia: {
    played: Number,
    score: Number,
    wins: Number,
    loss: Number,
  },
});

module.exports = model("User", User);
