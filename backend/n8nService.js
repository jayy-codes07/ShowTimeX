const axios = require('axios');

const N8N_BASE = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';

const triggerN8n = async (webhookPath, data) => {
  try {
    await axios.post(`${N8N_BASE}/${webhookPath}`, data, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    console.log(`✅ n8n triggered [${webhookPath}]`);
  } catch (err) {
    console.error(`⚠️  n8n trigger failed [${webhookPath}]:`, err.message);
  }
};

module.exports = { triggerN8n };