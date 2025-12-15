const { Schema, model } = require("mongoose");

const Guild = new Schema({
  id: {
    type: String,
    required: true,
  },

  counting: {
    enabled: {
      type: Boolean,
      default: false,
    },

    count: {
      type: Number,
      default: 0,
    },

    previous: {
      user: {
        type: String,
        default: "",
      },

      message: {
        type: String,
        default: "",
      },
    },

    channel: String,
  },

  bump_channel: {
    type: String,
  },

  next_bump: {
    type: Date,
  },

  bot_logs: {
    enabled: {
      type: Boolean,
      default: false,
    },

    channel: String,
  },
});

module.exports = model("Guild", Guild);
