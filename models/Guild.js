const { Schema, model } = require("mongoose");

const Guild = new Schema({
  id: {
    type: String,
    required: true,
  },

  welcome: {
    enabled: {
      type: Boolean,
      default: false,
    },

    channelId: String,
  },

  goodbye: {
    enabled: {
      type: Boolean,
      default: false,
    },

    channelId: String,
  },

  leaderboard: {
    enabled: {
      type: Boolean,
      default: false,
    },

    channelId: String,
    messageId: String,
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

  bump: {
    enabled: {
      type: Boolean,
      default: false,
    },

    channelId: String,
    next: Date,
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
