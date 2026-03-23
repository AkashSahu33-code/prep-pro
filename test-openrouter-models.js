const https = require('https');

https.get('https://openrouter.ai/api/v1/models', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const models = JSON.parse(data).data;
      const fluxModels = models.filter(m => m.id.toLowerCase().includes('flux') || m.id.toLowerCase().includes('fal'));
      console.log('Found Flux/Fal models:');
      fluxModels.forEach(m => console.log(`- ${m.id}`));
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', err => console.error(err));
