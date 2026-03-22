const axios = require('axios');

const N8N_BASE = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

const triggerN8n = async (webhookPath, data) => {
  try {
    if (!process.env.N8N_WEBHOOK_URL) {
      console.warn('N8N_WEBHOOK_URL not configured, skipping trigger');
      return;
    }
    await axios.post(`${N8N_BASE}/${webhookPath}`, data, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    if (process.env.NODE_ENV === 'development') {
      console.log(`n8n webhook triggered: ${webhookPath}`);
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`n8n webhook failed [${webhookPath}]:`, err.message);
    }
  }
};

module.exports = { triggerN8n };