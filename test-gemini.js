/**
 * Test script to verify Gemini API key is working
 * Run: node test-gemini.js
 */

const https = require('https');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your_key_here';

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_key_here') {
  console.error('❌ GEMINI_API_KEY not set in environment');
  process.exit(1);
}

const prompt = `Verify this claim: "India's GDP grew at 7.5% in 2024". 
Respond with JSON: {"verdict": "accurate|misleading|false|unverifiable", "confidence": 0.0-1.0, "explanation": "..."}`;

const payload = JSON.stringify({
  contents: [
    {
      parts: [{ text: prompt }]
    }
  ],
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 512,
    topP: 0.8,
  }
});

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

console.log('🔍 Testing Gemini API with key:', GEMINI_API_KEY.substring(0, 10) + '...');
console.log('📤 Sending request to Gemini...');

https.request(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n📥 Response Status:', res.statusCode);
    console.log('📥 Response Headers:', res.headers);
    
    try {
      const json = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅ Gemini API is working!');
        console.log('Response:', JSON.stringify(json, null, 2));
      } else {
        console.log('❌ Gemini returned error:');
        console.log(JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
}).on('error', err => {
  console.error('❌ Request failed:', err.message);
  process.exit(1);
}).end(payload);
