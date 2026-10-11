/**
 * File: test.js
 * Description: Quick script to test backend API routes directly from terminal.
 */

async function testBackend() {
  try {
    console.log("⏳ Sending test transaction to server...");

    // 1. POST Request: नया डेटा भेजने के लिए
    const response = await fetch('http://localhost:5000/api/transactions/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'cashOut',
        description: 'Terminal Test Chai',
        amount: 40,
        category: 'Snacks'
      }),
    });

    const result = await response.json();
    console.log("✅ POST Response:", result);

    // 2. GET Request: सारे ट्रांजैक्शन्स देखने के लिए
    console.log("\n⏳ Fetching all transactions...");
    const getResponse = await fetch('http://localhost:5000/api/transactions');
    const getResult = await getResponse.json();
    console.log("✅ GET Response (All Data):", getResult);

  } catch (error) {
    console.error("❌ Test failed with error:", error);
  }
}

testBackend();