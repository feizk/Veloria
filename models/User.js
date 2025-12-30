const { Schema, model } = require("mongoose");

const User = new Schema(
  {
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
      default: false,
    },

    trivia: {
      played: {
        type: Number,
        default: 0,
      },

      score: {
        type: Number,
        default: 50,
      },

      wins: {
        type: Number,
        default: 0,
      },

      loss: {
        type: Number,
        default: 0,
      },
    },

    // NOTE; Users can gain XP by messaging OR using bot activities
    // ON-HOLD
    xp: {
      type: Number,
      default: 0,
    },

    messages: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

module.exports.MAX_MESSAGES_COUNT = 1_000_000_000;
module.exports = model("User", User);
