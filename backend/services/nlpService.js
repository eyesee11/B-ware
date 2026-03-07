const axios = require('axios');

// HF cold start can take 30-50s — timeout set high intentionally
const nlp = axios.create({
  baseURL: process.env.NLP_SERVICE_URL || 'https://eyesee11-b-ware.hf.space',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

nlp.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status;
    const detail = err.response?.data?.detail ?? err.message;
    const e = new Error(`NLP [${status}]: ${detail}`);
    e.status     = status;
    e.nlpDetail  = detail;
    return Promise.reject(e);
  }
);

module.exports = nlp;