const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// POST: Add a new transaction with user association and backend validation
router.post('/add', async (req, res) => {
  try {
    const { userId, type, description, amount, category } = req.body;

    // Backend validation checks
    if (!userId || !type || !description || amount === undefined || !category) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields including userId are required." 
      });
    }

    if (type !== 'cashIn' && type !== 'cashOut') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid transaction type." 
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Amount must be a valid positive number." 
      });
    }

    const newTransaction = new Transaction({
      userId,
      type,
      description: description.trim(),
      amount,
      category: category.trim()
    });

    const savedTransaction = await newTransaction.save();
    res.status(201).json({ success: true, data: savedTransaction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET: Fetch all transactions for a specific user sorted by creation date (newest first)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE: Remove a specific transaction by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTransaction = await Transaction.findByIdAndDelete(id);

    if (!deletedTransaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    res.status(200).json({ success: true, message: "Transaction deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;