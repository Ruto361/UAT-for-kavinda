// GET /api/signoff/latest — returns the most recent sign-off (used to lock the page on reload)
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  try {
    const store = getStore({ name: 'kavinda-uat', consistency: 'strong' });
    const raw = await store.get('signoffs', { type: 'text' });
    const list = raw ? JSON.parse(raw) : [];
    if (!list.length) {
      return new Response(JSON.stringify({ signed: false }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const r = list[0];
    return new Response(JSON.stringify({
      signed: true,
      ref: r.ref,
      signedBy: r.signedBy,
      title: r.title,
      date: r.date,
      timestamp: r.timestamp,
      signatureType: r.signatureType,
      signature: r.signature,
      notes: r.notes,
      stats: r.stats,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ signed: false, error: e.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = { path: '/api/signoff/latest' };
