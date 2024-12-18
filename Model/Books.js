const mongoose = require('mongoose');
/**
 * title: titre d'un book
 */
const BookSchema = mongoose.Schema({
  title: {type: String, required: true},
  description: {type: String, required: true}
});

module.exports = mongoose.model('Books', BookSchema);