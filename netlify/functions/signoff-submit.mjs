// POST /api/signoff — record a client sign-off using Netlify Blobs
import { getStore } from '@netlify/blobs';

function genRef() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KVN-${ts}-${rnd}`;
}

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const ref = genRef();
    const record = {
      ref,
      signature: body.signature || '',
      signatureType: body.signatureType || 'type',
      signedBy: body.signedBy || 'Dr. Kavinda Gunasekara',
      title: body.title || 'Project Management Specialist, FAO',
      date: body.date || '',
      notes: body.notes || '',
      stats: body.stats || null,
      userAgent: req.headers.get('user-agent') || '',
      ip: req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || '',
      timestamp: new Date().toISOString(),
    };

    const store = getStore({ name: 'kavinda-uat', consistency: 'strong' });
    const existingRaw = await store.get('signoffs', { type: 'text' });
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift(record);
    await store.set('signoffs', JSON.stringify(existing.slice(0, 200)));

    return new Response(JSON.stringify({ ok: true, ref, timestamp: record.timestamp }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message || 'invalid' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const config = { path: '/api/signoff' };
