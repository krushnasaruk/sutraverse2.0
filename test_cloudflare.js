/**
 * Cloudflare and IP Ban Test Script
 * 
 * This script sends 70 concurrent requests to the production website
 * to test both:
 * 1. The application's upgraded rate limiter with 1-hour IP banning.
 * 2. Cloudflare's WAF block detection (if you set up the User-Agent rule).
 * 
 * Run with: node test_cloudflare.js
 */

async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function runTest() {
  // Pointing to a real file that actually exists on your cPanel server
  const targetUrl = "https://sutraverse.co.in/api/downloads/1775794029097_IKS_Assignment_8.pdf";
  const totalRequests = 300;
  const requests = [];

  let allowed = 0;
  let appBlocked = 0;
  let cfBlocked = 0;
  let failed = 0;
  let banMessage = "";

  console.log(`Sending ${totalRequests} concurrent requests to ${targetUrl}...\n`);

  for (let i = 1; i <= totalRequests; i++) {
    requests.push(
      fetchWithTimeout(targetUrl, {
        headers: {
          // You can change this to "CloudflareTestAgent" to test Cloudflare WAF rules,
          // or leave it default to test the application-level rate limiter & IP banning.
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          "X-Test-Bypass": "sutraverse-bypass-key"
        }
      }, 5000)
      .then(async (res) => {
        const serverHeader = res.headers.get("server") || "";
        const isCfServer = serverHeader.toLowerCase().includes("cloudflare");

        if (res.status === 200 || res.status === 404 || res.status === 307) {
          allowed++;
        } else if (res.status === 429) {
          try {
            const bodyText = await res.text();
            if (bodyText.includes("Too many requests. Please wait a few seconds.")) {
              appBlocked++;
            } else if (bodyText.includes("temporarily restricted")) {
              appBlocked++;
              // Capture the ban message to print it out later
              try {
                const json = JSON.parse(bodyText);
                banMessage = json.error;
              } catch (e) {
                banMessage = bodyText;
              }
            } else {
              cfBlocked++;
            }
          } catch (e) {
            cfBlocked++;
          }
        } else if (isCfServer && (res.status === 403 || res.status === 503 || res.status === 1015)) {
          cfBlocked++;
        } else {
          appBlocked++;
        }
      })
      .catch((err) => {
        failed++;
      })
    );
  }

  await Promise.all(requests);

  console.log("=== Test Results Summary ===");
  console.log(`Allowed:            ${allowed}`);
  console.log(`Blocked by App:     ${appBlocked}`);
  console.log(`Blocked by WAF/CF:  ${cfBlocked}`);
  console.log(`Failed (Network):   ${failed}`);
  
  if (banMessage) {
    console.log(`\n🔒 IP Ban Active: "${banMessage}"`);
  }
}

runTest();
