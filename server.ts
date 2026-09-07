import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { email } = req.body;
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        // Return a dummy url for development if no key is provided
        console.warn("STRIPE_SECRET_KEY is missing. Mocking success.");
        return res.json({ url: "/?payment=mock_success" });
      }

      const stripe = new Stripe(stripeSecret);
      
      const origin = req.headers.origin || (req.headers.referer ? req.headers.referer.split('?')[0].replace(/\/$/, '') : '');
      const baseUrl = process.env.APP_URL || origin || `${req.protocol}://${req.get('host')}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Garden Cheat Codes Vault Access',
                description: 'Full access to 500+ vegetable cheat codes',
              },
              unit_amount: 3700, // $37.00
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/?payment=success`,
        cancel_url: `${baseUrl}/?payment=cancelled`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      const apiKey = process.env.BEEHIIV_API_KEY;
      let pubId = process.env.BEEHIIV_PUBLICATION_ID;

      if (!apiKey || !pubId) {
        console.warn("Beehiiv API keys are missing in environment variables.");
        // Still return success in development to not block the UX flow
        return res.status(200).json({ success: true, warning: "Keys missing, mock success." });
      }

      // Beehiiv requires the publication ID to start with "pub_"
      if (!pubId.startsWith("pub_")) {
        pubId = `pub_${pubId}`;
      }

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const response = await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: "garden-cheat-codes",
          utm_medium: "app",
          utm_campaign: "welcome-sequence"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Beehiiv API Error:", errorText);
        return res.status(response.status).json({ error: "Failed to subscribe user" });
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (error) {
      console.error("Error subscribing user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
