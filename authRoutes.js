const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

let admin;
try {
  admin = require('firebase-admin');
  if (admin && (!admin.apps || admin.apps.length === 0)) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
      })
    });
  }
} catch (error) {
  console.error("Firebase Admin Initialization Warning:", error.message);
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with email and password
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, securityQuestion, securityAnswer } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered. Please sign in.' });
    }

    if (password.length < 6 || password.length > 15) {
      return res.status(400).json({ success: false, message: 'Password must be between 6 and 15 characters.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      securityQuestion: securityQuestion || 'What is your favourite month',
      securityAnswer
    });

    await newUser.save();

    res.status(201).json({ 
      success: true, 
      message: 'Account created successfully!',
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });

  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate or register user via Google Firebase ID Token
 */
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Firebase ID token is missing.' });
    }

    if (!admin) {
      return res.status(500).json({ success: false, message: 'Firebase Admin SDK is not initialized.' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email, name, uid } = decodedToken;

    let user = await User.findOne({ email });

    if (!user) {
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = new User({
        name: name || 'Google User',
        email,
        password: dummyPassword,
        securityQuestion: 'Google Authentication',
        securityAnswer: 'Google'
      });
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Google authentication successful!',
      user: { id: user._id, name: user.name, email: user.email, firebaseUid: uid }
    });

  } catch (error) {
    console.error('Google Auth Verification Error:', error.message);
    res.status(401).json({ success: false, message: 'Unauthorized: Invalid Firebase token.' });
  }
});

module.exports = router;
