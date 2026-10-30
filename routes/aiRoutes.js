const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const Transaction = require('../models/Transaction');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/process-ai', async (req, res) => {
  try {
    const { message, userId } = req.body;
    console.log("रोहिक्स के पास नया मैसेज आया:", message);

    if (!message) {
      return res.status(400).json({ success: false, error: 'संदेश खाली नहीं हो सकता।' });
    }

    const prompt = `
    Analyze this text and extract financial details in strict JSON format only. No markdown, no extra text.
    {
      "type": "cashIn" or "cashOut",
      "category": "Salary & Income" or "Entertainment & Leisure" or "Food & Dining" or "Transport & Logistics" or "General" or "Health & Care" or "Other",
      "amount": number,
      "description": "short text max 40 chars"
    }
    Text: "${message}"
    `;

    // सुपर-फास्ट और स्टेबल कॉन्फिगरेशन
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        maxOutputTokens: 100
      }
    });

    const aiResponseText = response.text || '{}';
    console.log("जेमिनी का रॉ रिस्पॉन्स:", aiResponseText);

    let transactionData = {};
    try {
      let cleanedJson = aiResponseText.trim();
      cleanedJson = cleanedJson.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBrace = cleanedJson.indexOf('{');
      const lastBrace = cleanedJson.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedJson = cleanedJson.substring(firstBrace, lastBrace + 1);
      }
      transactionData = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.warn("⚠️ JSON Parse फेल हुआ, स्मार्ट फॉलबैक का इस्तेमाल किया जा रहा है...");
      const amountMatch = message.match(/\d+/);
      const isIncome = message.toLowerCase().includes('salary') || message.toLowerCase().includes('received') || message.toLowerCase().includes('got');
      
      transactionData = {
        type: isIncome ? 'cashIn' : 'cashOut',
        category: 'General',
        amount: amountMatch ? parseInt(amountMatch[0]) : 0,
        description: message
      };
    }

    let rawType = (transactionData.type || 'cashOut').toLowerCase();
    let finalType = rawType.includes('in') || rawType.includes('salary') ? 'cashIn' : 'cashOut';

    const newTransaction = new Transaction({
      userId: userId || 'default_user_161011', // डैशबोर्ड की डिफॉल्ट आईडी से मैच करने के लिए
      type: finalType,
      category: transactionData.category || 'General',
      amount: transactionData.amount || 0,
      description: (transactionData.description || message).substring(0, 40),
      date: new Date()
    });

    await newTransaction.save();
    console.log("⚡ रोहिक्स ने चुटकियों में डेटाबेस में सेव कर दिया!");

    res.status(200).json({
      success: true,
      message: `रोहिक्स ने ₹${transactionData.amount} का ${transactionData.category || 'General'} तुरंत दर्ज कर लिया है!`,
      transaction: newTransaction
    });

  } catch (error) {
    console.error('AI Processing Error:', error);
    res.status(500).json({ success: false, error: 'रोहिक्स को समझने में दिक्कत आई, कृपया दोबारा बोलें।' });
  }
});

module.exports = router;