export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, zipCode } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const apiKey = process.env.BEEHIIV_API_KEY;
    let pubId = process.env.BEEHIIV_PUBLICATION_ID;

    // If Beehiiv keys are configured, send to Beehiiv API
    if (apiKey && pubId) {
      if (!pubId.startsWith('pub_')) {
        pubId = `pub_${pubId}`;
      }

      const beehiivRes = await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: 'garden-cheat-codes',
          utm_medium: 'app',
          utm_campaign: 'tomato-cheat-codes',
          custom_fields: zipCode ? [{ name: 'zip_code', value: zipCode }] : []
        })
      });

      if (!beehiivRes.ok) {
        const errText = await beehiivRes.text();
        console.warn('Beehiiv API subscription warning:', errText);
      }
    } else {
      console.log(`[Lead Captured] Stored email locally/mock: ${email} (ZIP: ${zipCode || 'N/A'})`);
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription successful. Welcome email on the way!',
      email,
      zipCode
    });
  } catch (error: any) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
