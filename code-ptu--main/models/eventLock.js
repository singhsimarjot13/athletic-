const mongoose = require('mongoose');

const MaleEventLock = new mongoose.Schema({
  collegeName: {
    type: String,
    required: true,
    unique: true
  },
  eventsLocked: {
    "100m Race": {
      type: Boolean,
      default: false
    },
    "200m Race": {
      type: Boolean,
      default: false
    },
    "400m Race": {
      type: Boolean,
      default: false
    },
    "800m Race": {
      type: Boolean,
      default: false
    },
    "1500m Race": {
      type: Boolean,
      default: false
    },
    "5000m Race": {
      type: Boolean,
      default: false
    },
    "10000m Race": {
      type: Boolean,
      default: false
    },
    "110m Hurdles": {
      type: Boolean,
      default: false
    },
    "400m Hurdles": {
      type: Boolean,
      default: false
    },
    "Long Jump": {
      type: Boolean,
      default: false
    },
    "Triple Jump": {
      type: Boolean,
      default: false
    },
    "High Jump": {
      type: Boolean,
      default: false
    },
    "Shot Put": {
      type: Boolean,
      default: false
    },
    "Discus Throw": {
      type: Boolean,
      default: false
    },
    "Javelin Throw": {
      type: Boolean,
      default: false
    },
    "Hammer Throw": {
      type: Boolean,
      default: false
    }
  }
});

module.exports = mongoose.model('MaleEventLock',MaleEventLock);
