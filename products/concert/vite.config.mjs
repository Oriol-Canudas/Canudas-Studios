import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins: [react(), {
  name: 'local-concert-api',
  configureServer(server) {
    for(const [route,limit] of [['negotiate',60000],['transcribe',2850000]])server.middlewares.use(`/api/${route}`, async (req, res) => {
      const { default: handler } = await import(`./api/${route}.mjs`);
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > limit) { res.statusCode = 413; return res.end(); } }
      try { req.body = body ? JSON.parse(body) : {}; } catch { res.statusCode = 400; return res.end('{}'); }
      res.status = n => {res.statusCode = n; return res;}; res.json = o => { res.setHeader('Content-Type','application/json'); res.end(JSON.stringify(o)); };
      await handler(req, res);
    });
  }
}]});
