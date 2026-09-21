const { neon } = require('@neondatabase/serverless');

let ensured = false;
async function ensureSchema(sql) {
  if (ensured) return;
  await sql`CREATE SCHEMA IF NOT EXISTS command_deck`;
  await sql`
    CREATE TABLE IF NOT EXISTS command_deck.projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'idea',
      description TEXT NOT NULL DEFAULT '',
      next_step TEXT NOT NULL DEFAULT '',
      blocker TEXT NOT NULL DEFAULT '',
      live_url TEXT NOT NULL DEFAULT '',
      repo_url TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`ALTER TABLE command_deck.projects ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT ''`;
  ensured = true;
}

function rowToProject(r) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    status: r.status,
    description: r.description,
    nextStep: r.next_step,
    blocker: r.blocker,
    liveUrl: r.live_url,
    repoUrl: r.repo_url,
    updatedAt: r.updated_at,
    imageUrl: r.image_url,
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const sql = neon(process.env.DATABASE_URL);
  await ensureSchema(sql);

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM command_deck.projects ORDER BY created_at ASC`;
    return res.status(200).json(rows.map(rowToProject));
  }

  const key = req.headers['x-api-key'];
  if (!process.env.PROJECTS_API_KEY || key !== process.env.PROJECTS_API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (req.method === 'POST') {
    const d = req.body || {};
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await sql`
      INSERT INTO command_deck.projects
        (id, name, category, status, description, next_step, blocker, live_url, repo_url, updated_at, image_url)
      VALUES
        (${id}, ${d.name || ''}, ${d.category || ''}, ${d.status || 'idea'}, ${d.description || ''},
         ${d.nextStep || ''}, ${d.blocker || ''}, ${d.liveUrl || ''}, ${d.repoUrl || ''}, ${d.updatedAt || ''}, ${d.imageUrl || ''})
    `;
    return res.status(200).json({ id, ...d });
  }

  if (req.method === 'PUT') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'missing id' });
    const d = req.body || {};
    await sql`
      UPDATE command_deck.projects SET
        name = ${d.name || ''}, category = ${d.category || ''}, status = ${d.status || 'idea'},
        description = ${d.description || ''}, next_step = ${d.nextStep || ''}, blocker = ${d.blocker || ''},
        live_url = ${d.liveUrl || ''}, repo_url = ${d.repoUrl || ''}, updated_at = ${d.updatedAt || ''},
        image_url = COALESCE(${d.imageUrl ?? null}, image_url)
      WHERE id = ${id}
    `;
    return res.status(200).json({ id, ...d });
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'missing id' });
    await sql`DELETE FROM command_deck.projects WHERE id = ${id}`;
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
};
