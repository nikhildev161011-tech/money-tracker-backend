const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is missing in environment variables.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas successfully.");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/transactions', transactionRoutes);
app.use('/api/auth', authRoutes);

app.delete('/api/users/delete/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const db = mongoose.connection;

    await db.collection('transactions').deleteMany({ userId: userId });

    let deleteResult = await db.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
    if (deleteResult.deletedCount === 0) {
      await db.collection('users').deleteOne({ id: userId });
    }

    res.status(200).json({ success: true, message: "Account and associated data deleted successfully." });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ success: false, message: "Server error while deleting account." });
  }
});

app.get('/', (req, res) => {
  res.status(200).json({ status: "Money Tracker Backend is running smoothly." });
});

const BACKEND_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
setInterval(() => {
  fetch(BACKEND_URL)
    .then(res => console.log("Keep-alive ping sent successfully."))
    .catch(err => console.error("Keep-alive ping error:", err.message));
}, 14 * 60 * 1000);

app.use((err, req, res, next) => {
  console.error("Server Error Stack:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error."
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
