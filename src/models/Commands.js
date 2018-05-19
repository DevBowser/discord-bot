var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var commandSchema = new Schema({
  trigger: String,
  command: String,
});

module.exports = mongoose.model('Expense', expenseSchema);
