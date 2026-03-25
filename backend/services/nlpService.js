const axios = require("axios");

// create axios instance to call our NLP (AI) service
// timeout is kept high because HuggingFace free server can take time to start

const nlp = axios.create({
  baseURL: process.env.NLP_SERVICE_URL || "https://eyesee11-b-ware.hf.space",
  timeout: 60000, 
  headers: {
    "Content-Type": "application/json", 
  },
});

// interceptor to handle errors from NLP service
nlp.interceptors.response.use(
  (res) => res, 
  (err) => {
    const status = err.response?.status;

    // get detailed error message if API sends it
    const detail = err.response?.data?.detail ?? err.message;

    // create custom error so backend can understand the issue
    const e = new Error(`NLP Error [${status}]: ${detail}`);

    e.status = status;
    e.nlpDetail = detail;

    return Promise.reject(e); 
  }
);

module.exports = nlp; 