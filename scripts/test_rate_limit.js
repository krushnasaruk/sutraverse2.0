/**
 * Rate Limit Test Script
 * 
 * This script makes 12 consecutive requests to the local downloads API.
 * Since the limit is set to 10 requests per 10 seconds, the 11th and 12th
 * requests should receive a "429 Too Many Requests" response from the server.
 */

async function runTest() {
  console.log("Starting rate limit test...");
  console.log("Sending 12 rapid requests to local downloads API...");

  for (let i = 1; i <= 12; i++) {
    try {
      // Query the local downloads API route (we don't need a real file, a dummy one is fine)
      const res = await fetch('http://localhost:3000/api/downloads/non_existent_file_test.pdf');
      
      if (res.status === 429) {
        console.log(`Request ${i}: ❌ Blocked (Status 429 - Too Many Requests)`);
      } else {
        // It might be 404 (file not found) which is still a successful HTTP response (not rate-limited)
        console.log(`Request ${i}:  Allowed (Status ${res.status})`);
      }
    } catch (err) {
      console.log(`Request ${i}: 💥 Failed to connect:`, err.message);
    }
  }

  console.log("\nTest completed.");
}

runTest();
