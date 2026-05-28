/* ===========================================
   KAVINDA UAT — Dashboard Interactivity
   Smooth scroll · State · Filters · Sounds
   Signature canvas · Lock screen · Backend
   =========================================== */

(function () {
  'use strict';

  // ============== STATE ==============
  const STORAGE_KEY = 'kavinda-uat-state-v1';
  const state = loadState();
  let uatData = [];
  let signatureMode = 'type';   // 'type' | 'draw'
  let signatureDataUrl = '';     // base64 PNG if drawn
  let hasInk = false;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      criteria: {},
      results: {},
      comments: {},
      signoff: null,
    };
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ============== LENIS SMOOTH SCROLL ==============
  let lenis = null;
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      lerp: 0.08,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href.length <= 1) return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -80, duration: 1.5 });
        }
      });
    });
  }

  // ============== REVEAL ON SCROLL ==============
  function initReveal() {
    const els = document.querySelectorAll('[data-reveal]');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach((el) => obs.observe(el));
  }

  // ============== NAV ==============
  function initNav() {
    const nav = document.getElementById('topnav');
    function update() {
      if (window.scrollY > 30) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
    window.addEventListener('scroll', update, { passive: true });
    update();

    const sections = ['hero', 'overview', 'sections', 'progress', 'signoff'];
    const links = document.querySelectorAll('.nav-link');
    function activeLink() {
      let active = 'hero';
      for (const id of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top < 200) active = id;
      }
      links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + active));
    }
    window.addEventListener('scroll', activeLink, { passive: true });
    activeLink();
  }

  // ============== SOUNDS ==============
  function initSounds() {
    let lastHover = 0;
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-sound], .scenario-clickable, .criterion-row, .nav-link, .filter-chip, .section-tab, .cta-primary, .cta-secondary, .control-btn, .cta-btn');
      if (!t) return;
      const now = performance.now();
      if (now - lastHover < 70) return;
      lastHover = now;
      window.MechSounds.play('key-soft');
    }, { passive: true });

    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-sound]');
      if (t) {
        const snd = t.getAttribute('data-sound') || 'key-thock';
        window.MechSounds.play(snd);
        return;
      }
      // default clicks on cards & criteria
      const card = e.target.closest('.scenario-clickable, .criterion-row, .filter-chip, .section-tab, .nav-link');
      if (card) window.MechSounds.play('key-soft');
    });

    const toggle = document.getElementById('sound-toggle');
    if (!toggle) return;
    const updateToggleUI = () => {
      const muted = window.MechSounds.isMuted();
      const icon = toggle.querySelector('i');
      icon.className = muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
      toggle.classList.toggle('muted', muted);
      toggle.title = muted ? 'Sounds muted — click to unmute' : 'Sounds on — click to mute';
    };
    updateToggleUI();
    toggle.addEventListener('click', () => {
      const newMuted = !window.MechSounds.isMuted();
      window.MechSounds.setMuted(newMuted);
      updateToggleUI();
      if (!newMuted) setTimeout(() => window.MechSounds.play('key-thock'), 50);
      toast(newMuted ? 'Keyboard sounds muted' : 'Keyboard sounds on', 'info');
    });
  }

  // ============== HYDRATION ==============
  function hydrateUI() {
    document.querySelectorAll('.criterion-cb').forEach((cb) => {
      const id = cb.getAttribute('data-uat');
      const idx = parseInt(cb.getAttribute('data-crit'), 10);
      const arr = state.criteria[id] || [];
      cb.checked = !!arr[idx];
    });

    document.querySelectorAll('.scenario-card').forEach((card) => {
      const id = card.getAttribute('data-id');
      const result = state.results[id];
      card.querySelectorAll('.result-btn').forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-result') === result);
      });
      card.classList.remove('is-pass', 'is-fail', 'is-partial', 'is-skip');
      if (result) card.classList.add('is-' + result);
    });

    document.querySelectorAll('[data-uat-comment]').forEach((inp) => {
      const id = inp.getAttribute('data-uat-comment');
      inp.value = state.comments[id] || '';
    });

    if (state.signoff) {
      const sigInp = document.getElementById('signature-input');
      const dateInp = document.getElementById('signoff-date');
      const notesInp = document.getElementById('signoff-notes');
      const titleInp = document.getElementById('signoff-title');
      if (sigInp && state.signoff.signature && state.signoff.signatureType === 'type') sigInp.value = state.signoff.signature;
      if (dateInp) dateInp.value = state.signoff.date || '';
      if (notesInp) notesInp.value = state.signoff.notes || '';
      if (titleInp && state.signoff.title) titleInp.value = state.signoff.title;
    }

    // Default date today
    const dateInp = document.getElementById('signoff-date');
    if (dateInp && !dateInp.value) dateInp.valueAsDate = new Date();

    updateAllProgress();
  }

  // ============== PROGRESS ==============
  function updateScenarioProgress(id) {
    const card = document.querySelector(`.scenario-card[data-id="${id}"]`);
    if (!card) return;
    const cbs = card.querySelectorAll('.criterion-cb');
    const checked = Array.from(cbs).filter((c) => c.checked).length;
    const total = cbs.length;
    const text = card.querySelector(`[data-progress-text-uat="${id}"]`);
    const fill = card.querySelector(`[data-bar-fill-uat="${id}"]`);
    if (text) text.textContent = `${checked} / ${total}`;
    if (fill) fill.style.width = total ? `${(checked / total) * 100}%` : '0%';

    const status = card.querySelector(`[data-status-uat="${id}"]`);
    if (status) {
      const result = state.results[id];
      if (result) {
        const map = { pass: 'PASSED', fail: 'FAILED', partial: 'PARTIAL', skip: 'SKIPPED' };
        status.textContent = map[result] || 'Pending';
      } else if (checked === 0) status.textContent = 'Not started';
      else if (checked === total) status.textContent = 'All checked';
      else status.textContent = 'In progress';
    }
  }

  function gatherStats() {
    let totalCrit = 0, doneCrit = 0;
    let totalScen = 0, passScen = 0;
    let priCounts = { critical: [0, 0], high: [0, 0], medium: [0, 0], low: [0, 0] };
    let sectionCounts = {};

    document.querySelectorAll('.scenario-card').forEach((card) => {
      const id = card.getAttribute('data-id');
      const sec = card.getAttribute('data-section');
      const pri = card.getAttribute('data-priority');
      const cbs = card.querySelectorAll('.criterion-cb');
      const checked = Array.from(cbs).filter((c) => c.checked).length;
      totalCrit += cbs.length;
      doneCrit += checked;
      totalScen++;
      const result = state.results[id];
      const passed = result === 'pass' || (cbs.length > 0 && checked === cbs.length);
      if (passed) passScen++;

      if (!sectionCounts[sec]) sectionCounts[sec] = [0, 0];
      sectionCounts[sec][1]++;
      if (passed) sectionCounts[sec][0]++;

      if (priCounts[pri]) {
        priCounts[pri][1]++;
        if (passed) priCounts[pri][0]++;
      }
      updateScenarioProgress(id);
    });

    const pct = totalScen ? Math.round((passScen / totalScen) * 100) : 0;
    return { totalCrit, doneCrit, totalScen, passScen, pct, priCounts, sectionCounts };
  }

  function updateAllProgress() {
    const s = gatherStats();
    const pctEl = document.getElementById('overall-pct');
    const fracEl = document.getElementById('overall-frac');
    const barEl = document.getElementById('overall-bar');
    if (pctEl) pctEl.textContent = s.pct + '%';
    if (fracEl) fracEl.textContent = `${s.passScen} / ${s.totalScen}`;
    if (barEl) barEl.style.width = s.pct + '%';

    const statusEl = document.getElementById('status-pill');
    if (statusEl) {
      statusEl.classList.remove('status-pending', 'status-progress', 'status-ready');
      if (s.pct === 0) { statusEl.classList.add('status-pending'); statusEl.textContent = 'PENDING'; }
      else if (s.priCounts.critical[1] > 0 && s.priCounts.critical[0] === s.priCounts.critical[1]) {
        statusEl.classList.add('status-ready'); statusEl.textContent = 'READY';
      } else { statusEl.classList.add('status-progress'); statusEl.textContent = 'IN PROGRESS'; }
    }

    const mCrit = document.getElementById('m-critical');
    const mHigh = document.getElementById('m-high');
    const mMed = document.getElementById('m-medium');
    if (mCrit) mCrit.textContent = `${s.priCounts.critical[0]}/${s.priCounts.critical[1]}`;
    if (mHigh) mHigh.textContent = `${s.priCounts.high[0]}/${s.priCounts.high[1]}`;
    if (mMed) mMed.textContent = `${s.priCounts.medium[0]}/${s.priCounts.medium[1]}`;

    Object.entries(s.sectionCounts).forEach(([letter, [done, total]]) => {
      const el = document.querySelector(`[data-section-count="${letter}"]`);
      if (el) el.textContent = `${done}/${total}`;
    });

    renderSectionProgressList(s.sectionCounts);
  }

  function renderSectionProgressList(sectionCounts) {
    const container = document.getElementById('section-progress-list');
    if (!container) return;
    if (container.children.length === 0) {
      const titles = {};
      uatData.forEach((s) => titles[s.letter] = s.title.split('—')[0].trim());
      container.innerHTML = Object.entries(sectionCounts).map(([letter, [done, total]]) => {
        const pct = total ? (done / total) * 100 : 0;
        return `
        <div class="sec-progress-row" data-sec-row="${letter}">
          <div class="sec-progress-letter">${letter}</div>
          <div class="sec-progress-name">${titles[letter] || letter}</div>
          <div class="sec-progress-bar"><span style="width:${pct}%"></span></div>
          <div class="sec-progress-count">${done}/${total}</div>
        </div>`;
      }).join('');
    } else {
      Object.entries(sectionCounts).forEach(([letter, [done, total]]) => {
        const row = container.querySelector(`[data-sec-row="${letter}"]`);
        if (!row) return;
        const pct = total ? (done / total) * 100 : 0;
        row.querySelector('.sec-progress-bar > span').style.width = pct + '%';
        row.querySelector('.sec-progress-count').textContent = `${done}/${total}`;
      });
    }
  }

  // ============== CARD EXPANSION (click anywhere, fixed bug) ==============
  function initCardExpansion() {
    // Use direct per-card handler — no event delegation — so only the clicked card toggles
    document.querySelectorAll('.scenario-card').forEach((card) => {
      const clickable = card.querySelector('.scenario-clickable');
      if (!clickable) return;
      clickable.addEventListener('click', (e) => {
        // Don't toggle if the click came from an inner interactive element (defensive)
        if (e.target.closest('input, textarea, button, .criterion-row, .result-btn')) return;
        const isExpanded = card.classList.contains('expanded');
        card.classList.toggle('expanded');
        window.MechSounds.play(isExpanded ? 'key-soft' : 'key-thock');
      });
    });
  }

  // ============== INTERACTIONS ==============
  function initInteractions() {
    // Criterion checkboxes — stop propagation so the card doesn't collapse
    document.querySelectorAll('.criterion-row').forEach((row) => {
      row.addEventListener('click', (e) => e.stopPropagation());
    });
    document.querySelectorAll('.criterion-cb').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        const id = cb.getAttribute('data-uat');
        const idx = parseInt(cb.getAttribute('data-crit'), 10);
        if (!state.criteria[id]) state.criteria[id] = [];
        state.criteria[id][idx] = cb.checked;
        saveState();
        updateScenarioProgress(id);
        updateAllProgress();
        if (cb.checked) window.MechSounds.play('key-thock');
        else window.MechSounds.play('key-soft');
      });
    });

    // Result buttons
    document.querySelectorAll('.result-btn').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = b.getAttribute('data-uat');
        const result = b.getAttribute('data-result');
        if (state.results[id] === result) delete state.results[id];
        else state.results[id] = result;
        saveState();
        const card = b.closest('.scenario-card');
        card.querySelectorAll('.result-btn').forEach((x) => x.classList.toggle('active', x.getAttribute('data-result') === state.results[id]));
        card.classList.remove('is-pass', 'is-fail', 'is-partial', 'is-skip');
        if (state.results[id]) card.classList.add('is-' + state.results[id]);
        updateAllProgress();
        if (result === 'pass') window.MechSounds.play('success');
      });
    });

    // Comments
    document.querySelectorAll('[data-uat-comment]').forEach((inp) => {
      inp.addEventListener('click', (e) => e.stopPropagation());
      inp.addEventListener('input', () => {
        const id = inp.getAttribute('data-uat-comment');
        state.comments[id] = inp.value;
        saveState();
      });
    });

    // Search & filters
    const search = document.getElementById('search-input');
    if (search) search.addEventListener('input', applyFilters);

    document.querySelectorAll('.filter-chip').forEach((c) => {
      c.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach((x) => x.classList.remove('active'));
        c.classList.add('active');
        applyFilters();
      });
    });

    document.querySelectorAll('.section-tab').forEach((t) => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.section-tab').forEach((x) => x.classList.remove('active'));
        t.classList.add('active');
        applyFilters();
        const letter = t.getAttribute('data-section');
        if (letter !== 'all') {
          const section = document.querySelector(`.uat-section[data-section-letter="${letter}"]`);
          if (section && lenis) lenis.scrollTo(section, { offset: -100, duration: 1.2 });
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (search) {
          search.focus();
          if (lenis) lenis.scrollTo(document.getElementById('sections'), { offset: -80 });
        }
      }
    });

    // Sign-off button
    const signBtn = document.getElementById('sign-btn');
    if (signBtn) signBtn.addEventListener('click', handleSignOff);

    // Comment / date / title inputs persist
    ['signature-input', 'signoff-date', 'signoff-notes', 'signoff-title'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        if (!state.signoff) state.signoff = {};
        const map = { 'signature-input': 'signature', 'signoff-date': 'date', 'signoff-notes': 'notes', 'signoff-title': 'title' };
        state.signoff[map[id]] = el.value;
        if (id === 'signature-input') state.signoff.signatureType = 'type';
        saveState();
      });
    });

    // Export
    const exportBtn = document.getElementById('export-btn');
    const exportReportBtn = document.getElementById('export-report-btn');
    const lockedDownloadBtn = document.getElementById('locked-download-btn');
    [exportBtn, exportReportBtn, lockedDownloadBtn].forEach((b) => b && b.addEventListener('click', exportReport));
  }

  // ============== FILTERS ==============
  function applyFilters() {
    const q = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const activeChip = document.querySelector('.filter-chip.active')?.getAttribute('data-filter') || 'all';
    const activeSec = document.querySelector('.section-tab.active')?.getAttribute('data-section') || 'all';
    let visible = 0;

    document.querySelectorAll('.uat-section').forEach((sec) => {
      const letter = sec.getAttribute('data-section-letter');
      let secVisible = 0;
      sec.querySelectorAll('.scenario-card').forEach((card) => {
        const pri = card.getAttribute('data-priority');
        const id = card.getAttribute('data-id');
        const title = card.querySelector('.scenario-title')?.textContent.toLowerCase() || '';
        const persona = card.querySelector('.scenario-persona')?.textContent.toLowerCase() || '';
        const story = card.querySelector('.scenario-story p')?.textContent.toLowerCase() || '';
        const criteria = Array.from(card.querySelectorAll('.criterion-text')).map((x) => x.textContent.toLowerCase()).join(' ');

        const matchQ = !q || id.toLowerCase().includes(q) || title.includes(q) || persona.includes(q) || story.includes(q) || criteria.includes(q);
        const matchChip = activeChip === 'all' || activeChip === pri;
        const matchSec = activeSec === 'all' || activeSec === letter;
        const show = matchQ && matchChip && matchSec;
        card.style.display = show ? '' : 'none';
        if (show) { secVisible++; visible++; }
      });
      sec.style.display = secVisible > 0 ? '' : 'none';
    });

    const empty = document.getElementById('empty-state');
    if (empty) empty.classList.toggle('hidden', visible > 0);
  }

  // ============== SIGNATURE CANVAS ==============
  function initSignatureCanvas() {
    const canvas = document.getElementById('signature-canvas');
    if (!canvas) return;
    const wrap = canvas.closest('.signature-canvas-wrap');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0, lastY = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.2;
    }
    setTimeout(resize, 30);
    window.addEventListener('resize', () => { setTimeout(resize, 50); });

    function pointFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      const point = e.touches ? e.touches[0] : e;
      return { x: point.clientX - rect.left, y: point.clientY - rect.top };
    }

    function start(e) {
      e.preventDefault();
      drawing = true;
      const p = pointFromEvent(e);
      lastX = p.x; lastY = p.y;
      // Tiny dot for taps
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      hasInk = true;
      wrap.classList.add('has-ink');
    }
    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      const p = pointFromEvent(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastX = p.x; lastY = p.y;
    }
    function end() {
      if (!drawing) return;
      drawing = false;
      signatureDataUrl = canvas.toDataURL('image/png');
      if (!state.signoff) state.signoff = {};
      state.signoff.signature = signatureDataUrl;
      state.signoff.signatureType = 'draw';
      saveState();
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
    canvas.addEventListener('pointerleave', end);

    // Clear
    const clearBtn = document.getElementById('sig-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasInk = false;
        signatureDataUrl = '';
        wrap.classList.remove('has-ink');
        if (state.signoff && state.signoff.signatureType === 'draw') {
          state.signoff.signature = '';
          saveState();
        }
        window.MechSounds.play('key-click');
      });
    }

    // Mode toggle
    document.querySelectorAll('.sig-toggle-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const mode = b.getAttribute('data-sig-mode');
        signatureMode = mode;
        document.querySelectorAll('.sig-toggle-btn').forEach((x) => x.classList.toggle('active', x === b));
        document.getElementById('sig-type-mode').classList.toggle('hidden', mode !== 'type');
        document.getElementById('sig-draw-mode').classList.toggle('hidden', mode !== 'draw');
        if (mode === 'draw') setTimeout(resize, 50);
      });
    });
  }

  // ============== SIGN-OFF SUBMISSION ==============
  async function handleSignOff() {
    let signature = '';
    let sigType = signatureMode;

    if (signatureMode === 'type') {
      const v = document.getElementById('signature-input').value.trim();
      if (!v) { toast('Please type your full name to sign', 'error'); return; }
      if (v.length < 2) { toast('Please enter your full name', 'error'); return; }
      signature = v;
    } else {
      if (!hasInk && !signatureDataUrl) {
        toast('Please draw your signature in the box', 'error');
        return;
      }
      signature = signatureDataUrl || document.getElementById('signature-canvas').toDataURL('image/png');
    }

    const date = document.getElementById('signoff-date').value;
    const notes = document.getElementById('signoff-notes').value;
    const title = document.getElementById('signoff-title').value;
    if (!date) { toast('Please set a sign-off date', 'error'); return; }

    const s = gatherStats();

    // Loading state
    const btn = document.getElementById('sign-btn');
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Recording approval...';

    const payload = {
      signature,
      signatureType: sigType,
      signedBy: 'Dr. Kavinda Gunasekara',
      title,
      date,
      notes,
      stats: {
        passed: s.passScen,
        total: s.totalScen,
        percent: s.pct,
        criteriaChecked: s.doneCrit,
        criteriaTotal: s.totalCrit,
        criticalDone: s.priCounts.critical[0],
        criticalTotal: s.priCounts.critical[1],
      },
    };

    let result;
    try {
      const res = await fetch('/api/signoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      result = await res.json();
      if (!result.ok) throw new Error(result.error || 'Failed');
    } catch (e) {
      console.warn('Backend submit failed, using local-only fallback', e);
      result = {
        ok: true,
        ref: 'KVN-LOCAL-' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    }

    state.signoff = {
      signed: true,
      signature,
      signatureType: sigType,
      signedBy: payload.signedBy,
      title,
      date,
      notes,
      ref: result.ref,
      timestamp: result.timestamp,
      stats: payload.stats,
    };
    saveState();

    btn.disabled = false;
    btn.innerHTML = origHtml;

    window.MechSounds.play('success');
    showLockedView();
  }

  // ============== LOCKED VIEW ==============
  function showLockedView() {
    if (!state.signoff || !state.signoff.signed) return;
    const lock = document.getElementById('signoff-locked');
    const form = document.getElementById('signoff-form');
    if (!lock || !form) return;

    // Populate
    const nameEl = document.getElementById('locked-name');
    const signedBy = document.getElementById('locked-signed-by');
    const dt = document.getElementById('locked-datetime');
    const ref = document.getElementById('locked-ref');
    const ref2 = document.getElementById('locked-ref-2');
    const stats = document.getElementById('locked-stats');
    const serverTime = document.getElementById('locked-server-time');
    const sigDisplay = document.getElementById('locked-sig-display');

    const s = state.signoff;
    if (nameEl) nameEl.textContent = s.signedBy || 'Dr. Kavinda Gunasekara';
    if (signedBy) signedBy.textContent = `${s.signedBy || 'Dr. Kavinda Gunasekara'} · ${s.title || ''}`;
    const dtStr = new Date(s.timestamp || Date.now()).toLocaleString(undefined, {
      dateStyle: 'long', timeStyle: 'short',
    });
    if (dt) dt.textContent = dtStr;
    if (ref) ref.textContent = `REF · ${(s.ref || '').slice(-8)}`;
    if (ref2) ref2.textContent = s.ref || '—';
    if (serverTime) serverTime.textContent = new Date(s.timestamp || Date.now()).toLocaleString();
    if (stats && s.stats) {
      stats.textContent = `${s.stats.passed}/${s.stats.total} · ${s.stats.percent}% · ${s.stats.criteriaChecked}/${s.stats.criteriaTotal} criteria`;
    }
    if (sigDisplay) {
      if (s.signatureType === 'draw' && s.signature && s.signature.startsWith('data:image')) {
        sigDisplay.innerHTML = `<img src="${s.signature}" alt="signature">`;
      } else {
        sigDisplay.innerHTML = `<span class="typed-sig">${(s.signature || '').replace(/[<>]/g, '')}</span>`;
      }
    }

    // Reveal & lock
    lock.classList.remove('hidden');
    document.body.classList.add('app-locked');
    if (lenis) lenis.stop();
    setTimeout(() => {
      const sec = document.getElementById('signoff');
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  // ============== TOAST ==============
  function toast(msg, kind = 'info') {
    const cont = document.getElementById('toast-container');
    if (!cont) return;
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
    t.innerHTML = `<i class="fa-solid ${icons[kind] || icons.info}"></i><span>${msg}</span>`;
    cont.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 3000);
  }

  // ============== EXPORT ==============
  function exportReport() {
    const rows = [];
    rows.push(['UAT ID', 'Title', 'Priority', 'Section', 'Result', 'Criteria Passed', 'Criteria Total', 'Comments']);
    document.querySelectorAll('.scenario-card').forEach((card) => {
      const id = card.getAttribute('data-id');
      const title = card.querySelector('.scenario-title')?.textContent || '';
      const pri = card.querySelector('.scenario-pri')?.textContent || '';
      const sec = card.getAttribute('data-section');
      const cbs = card.querySelectorAll('.criterion-cb');
      const checked = Array.from(cbs).filter((c) => c.checked).length;
      const result = state.results[id] || '';
      const comment = state.comments[id] || '';
      rows.push([id, title, pri, sec, result, checked, cbs.length, comment]);
    });

    // Header section with sign-off info
    let header = '';
    if (state.signoff && state.signoff.signed) {
      header = [
        ['Kavinda UAT — Approval Report'],
        ['Reference', state.signoff.ref],
        ['Signed By', state.signoff.signedBy],
        ['Title', state.signoff.title],
        ['Date', state.signoff.date],
        ['Timestamp', state.signoff.timestamp],
        ['Notes', state.signoff.notes],
        [''],
      ].map((r) => r.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
    }
    const csv = header + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kavinda-uat-${state.signoff?.ref || 'report'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('UAT report downloaded', 'success');
  }

  // ============== CHECK BACKEND FOR EXISTING SIGN-OFF ==============
  async function checkExistingSignoff() {
    try {
      const res = await fetch('/api/signoff/latest');
      const data = await res.json();
      if (data.signed) {
        state.signoff = {
          signed: true,
          signature: data.signature,
          signatureType: data.signatureType,
          signedBy: data.signedBy,
          title: data.title,
          date: data.date,
          notes: data.notes,
          ref: data.ref,
          timestamp: data.timestamp,
          stats: data.stats,
        };
        saveState();
        showLockedView();
      }
    } catch (e) {
      // backend not available — fall back to local state
      if (state.signoff && state.signoff.signed) showLockedView();
    }
  }

  // ============== INIT ==============
  async function init() {
    try { uatData = await (await fetch('/api/uat')).json(); } catch (e) {}

    initLenis();
    initReveal();
    initNav();
    initSounds();
    initCardExpansion();
    initInteractions();
    initSignatureCanvas();
    hydrateUI();
    applyFilters();
    await checkExistingSignoff();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
