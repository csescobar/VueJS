const { Schema, model} = require("mongoose");

const ItemSchema = new Schema({
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

module.exports = model("Item", ItemSchema);