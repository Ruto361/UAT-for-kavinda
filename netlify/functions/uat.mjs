// Returns the UAT scenario data as JSON
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (req, context) => {
  try {
    // The JSON is bundled with the function via netlify.toml [functions.included_files]
    const filePath = path.join(__dirname, 'uat-data.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return new Response(data, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'data unavailable', message: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = { path: '/api/uat' };
