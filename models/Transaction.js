const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  type: { 
    type: String, 
    enum: ['cashIn', 'cashOut'], 
    required: true 
  },
  description: { 
    type: String, 
    required: true, 
    maxlength: 40 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
