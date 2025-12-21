const { Schema, model } = require("mongoose");

const User = new Schema({
  id: {
    type: String,
    required: true,
  },

  whitelisted: {
    type: Boolean,
    required: false,
    default: false,
  },

  trivia: {
    played: Number,
    wins: Number,
    loss: Number
  }
});

module.exports = model("User", User);
