// POST /api/signoff/reset?key=... — clears all sign-offs (dev-team only)
import { getStore } from '@netlify/blobs';

const RESET_KEY = 'kavinda-dev-reset-2026';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }
  const url = new URL(req.url);
  if (url.searchParams.get('key') !== RESET_KEY) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const store = getStore({ name: 'kavinda-uat', consistency: 'strong' });
    await store.set('signoffs', '[]');
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = { path: '/api/signoff/reset' };
