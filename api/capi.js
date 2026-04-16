const TOKEN = process.env.META_CAPI_TOKEN || 'EAA7FUvRUi1ABRMWMdVOvrdLDuDLOrpELwvLTqwhhk0WFaJ1FjQC09Jwyii3hiqravYCWpBbedZBhFDHqa5toQVfMoa0IHTZAWCUopPDaMxRZCFrDDJZCZC0hrL2eub1twrnzC9bbuSBT8zUvbY5vXWZACasvyZAY71femJfXXlqCCRsOQc8fDNcwZAbIKauyGAZDZD';

const PIXELS = [
  '1291567026203099',
  '4494888827459495',
  '24710384898589911'
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { event_name, event_source_url, client_ip_address, client_user_agent, fbp, fbc } = req.body;

  if (!event_name) return res.status(400).json({ error: 'event_name required' });

  const eventTime = Math.floor(Date.now() / 1000);

  const userData = {
    client_ip_address: client_ip_address || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
    client_user_agent: client_user_agent || req.headers['user-agent'] || '',
  };
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const payload = {
    data: [{
      event_name,
      event_time: eventTime,
      action_source: 'website',
      event_source_url: event_source_url || '',
      user_data: userData,
    }],
    access_token: TOKEN,
  };

  const results = await Promise.allSettled(
    PIXELS.map(pixelId =>
      fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json())
    )
  );

  return res.status(200).json({ ok: true, results: results.map(r => r.value || r.reason) });
}
