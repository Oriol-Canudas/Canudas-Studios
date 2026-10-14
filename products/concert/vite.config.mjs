import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins: [react(), {
  name: 'local-concert-api',
  configureServer(server) {
    server.middlewares.use('/api/negotiate', async (req, res) => {
      const { default: handler } = await import('./api/negotiate.mjs');
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 60000) { res.statusCode = 413; return res.end(); } }
      try { req.body = body ? JSON.parse(body) : {}; } catch { res.statusCode = 400; return res.end('{}'); }
      res.status = n => {res.statusCode = n; return res;}; res.json = o => { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(o)); };
      await handler(req, res);
    });
  }
}]});
