const { execSync } = require('child_process');

function runCurl(name, cmd) {
    console.log(`\n--- ${name} ---`);
    console.log(`Command: ${cmd}`);
    try {
        const out = execSync(cmd, { encoding: 'utf8' });
        console.log(`Output:\n${out}`);
        return JSON.parse(out);
    } catch (e) {
        console.error(`Error: ${e.stdout || e.message}`);
        return null;
    }
}

const baseUrl = "http://localhost:5000/api";
const email = `testuser_${Date.now()}@example.com`;

runCurl('REGISTER', `curl.exe -s -X POST "${baseUrl}/auth/register" -H "Content-Type: application/json" -d "{\\"name\\":\\"Tester\\",\\"email\\":\\"${email}\\",\\"password\\":\\"testpass123\\"}"`);

const loginRes = runCurl('LOGIN', `curl.exe -s -X POST "${baseUrl}/auth/login" -H "Content-Type: application/json" -d "{\\"email\\":\\"${email}\\",\\"password\\":\\"testpass123\\"}"`);
const token = loginRes?.token || "INVALID_TOKEN";

runCurl('VERIFY CLAIM', `curl.exe -s -X POST "${baseUrl}/claims/verify" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d "{\\"text\\":\\"India GDP grew by 7.5% in 2024\\"}"`);

runCurl('HISTORY', `curl.exe -s -X GET "${baseUrl}/claims?page=1&limit=5" -H "Authorization: Bearer ${token}"`);

runCurl('STATS', `curl.exe -s -X GET "${baseUrl}/claims/stats" -H "Authorization: Bearer ${token}"`);

runCurl('TRENDING', `curl.exe -s -X GET "${baseUrl}/trending"`);
