export const config = { runtime: 'edge' };

export default async function handler(req) {
    const url = new URL(req.url);
    const target = url.searchParams.get('url');
    if (!target) return new Response('Missing ?url=', { status: 400 });

    try {
        const forwardHeaders = new Headers();
        for (const h of ['cookie', 'x-csrf-token', 'content-type', 'user-agent']) {
            const v = req.headers.get(h);
            if (v) forwardHeaders.set(h, v);
        }

        let body = null;
        if (req.method === 'POST') body = await req.text();

        const resp = await fetch(decodeURIComponent(target), {
            method: req.method,
            headers: forwardHeaders,
            body,
        });

        const respHeaders = new Headers();
        respHeaders.set('Access-Control-Allow-Origin', '*');
        respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        respHeaders.set('Access-Control-Allow-Headers', '*');
        respHeaders.set('Access-Control-Expose-Headers', 'x-csrf-token, X-CSRF-Token');

        const ct = resp.headers.get('content-type');
        if (ct) respHeaders.set('Content-Type', ct);

        for (const [k, v] of resp.headers.entries()) {
            if (k.toLowerCase() === 'x-csrf-token') respHeaders.set('X-CSRF-Token', v);
        }

        const respBody = await resp.arrayBuffer();
        return new Response(respBody, { status: resp.status, headers: respHeaders });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
}
