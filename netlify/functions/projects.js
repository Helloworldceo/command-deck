const { getStore } = require('@netlify/blobs');

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const store = getStore('projects');
  const method = event.httpMethod;

  if (method === 'GET') {
    const { blobs } = await store.list();
    const items = await Promise.all(
      blobs.map(async (b) => {
        const data = await store.get(b.key, { type: 'json' });
        return { id: b.key, ...(data || {}) };
      })
    );
    return json(200, items);
  }

  // Every mutating request needs the shared edit key.
  const key = event.headers['x-api-key'] || event.headers['X-Api-Key'];
  if (!process.env.PROJECTS_API_KEY || key !== process.env.PROJECTS_API_KEY) {
    return json(401, { error: 'unauthorized' });
  }

  if (method === 'POST') {
    const data = JSON.parse(event.body || '{}');
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    delete data.id;
    await store.setJSON(id, data);
    return json(200, { id, ...data });
  }

  if (method === 'PUT') {
    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id) return json(400, { error: 'missing id' });
    const patch = JSON.parse(event.body || '{}');
    const existing = (await store.get(id, { type: 'json' })) || {};
    const merged = { ...existing, ...patch };
    await store.setJSON(id, merged);
    return json(200, { id, ...merged });
  }

  if (method === 'DELETE') {
    const id = event.queryStringParameters && event.queryStringParameters.id;
    if (!id) return json(400, { error: 'missing id' });
    await store.delete(id);
    return json(200, { ok: true });
  }

  return json(405, { error: 'method not allowed' });
};
