// GET /api/signoffs — returns all sign-off records (used by /admin)
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  try {
    const store = getStore({ name: 'kavinda-uat', consistency: 'strong' });
    const raw = await store.get('signoffs', { type: 'text' });
    const list = raw ? JSON.parse(raw) : [];
    return new Response(JSON.stringify({ count: list.length, signoffs: list }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ count: 0, signoffs: [], error: e.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = { path: '/api/signoffs' };
