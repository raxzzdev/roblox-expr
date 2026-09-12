export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', 'x-csrf-token, X-CSRF-Token');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'Missing ?url= parameter' });
    }

    try {
        const targetUrl = decodeURIComponent(url);
        const forwardHeaders = {};
        const allowedHeaders = ['cookie', 'x-csrf-token', 'content-type', 'user-agent'];
        for (const h of allowedHeaders) {
            if (req.headers[h]) forwardHeaders[h] = req.headers[h];
        }

        let body = undefined;
        if (req.method === 'POST' && req.body) {
            body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: forwardHeaders,
            body,
        });

        const contentType = response.headers.get('content-type') || 'application/json';
        const csrfToken = response.headers.get('x-csrf-token');

        if (csrfToken) res.setHeader('X-CSRF-Token', csrfToken);
        res.setHeader('Content-Type', contentType);

        const data = await response.text();
        return res.status(response.status).send(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
                  }
