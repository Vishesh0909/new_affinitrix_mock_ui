/**
 * AFINTRIX ERP — Page command header
 *
 * Shared behaviour for the sticky header on the dashboard screens:
 *
 *   - condenses the title block as the page scrolls, keeping the tabs and
 *     actions reachable without a tall header eating the viewport
 *   - draws a reading-progress hairline along its lower edge
 *   - drives the Sync control through real idle / working / done states and
 *     stamps a live "updated" time
 *
 * Sync is honest about what it does: this build has no backend, so it
 * re-reads the data module and re-renders the screen. The page that owns the
 * data listens for `afx:refresh` and may return a promise; the button only
 * reports success once that work has actually finished.
 */

/**
 * Separate thresholds, deliberately far apart. Collapsing the header makes it
 * ~60px shorter, which shifts the scroll position; a single threshold sits
 * inside that delta and the header flips back and forth (the "wobble").
 * Condense on the way down at 76, release on the way up at 16.
 */
const CONDENSE_ON = 76;
const CONDENSE_OFF = 16;

/** "just now" / "4 min ago" / "14:32" once it is no longer recent. */
function relativeTime(from) {
  const seconds = Math.floor((Date.now() - from) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return new Date(from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ----------------------------------------------------------------------- */
/* Scroll: condense + progress                                              */
/* ----------------------------------------------------------------------- */

function wireScroll(header) {
  const scroller = header.closest('.afx-page');
  if (!scroller) return;

  const bar = header.querySelector('[data-progress]');
  let frame = 0;
  let condensed = false;

  const update = () => {
    frame = 0;
    const top = scroller.scrollTop;

    if (!condensed && top > CONDENSE_ON) condensed = true;
    else if (condensed && top < CONDENSE_OFF) condensed = false;
    header.classList.toggle('is-condensed', condensed);

    if (bar) {
      const span = scroller.scrollHeight - scroller.clientHeight;
      // No progress to report when the page does not scroll.
      const pct = span > 4 ? Math.min(100, (top / span) * 100) : 0;
      bar.style.width = `${pct}%`;
    }
  };

  scroller.addEventListener(
    'scroll',
    () => {
      if (!frame) frame = requestAnimationFrame(update);
    },
    { passive: true }
  );

  // Switching panels changes the content height without necessarily firing a
  // scroll event, so watch the content box as well as the window.
  window.addEventListener('resize', update);
  const inner = scroller.firstElementChild;
  if (inner && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(update);
    }).observe(inner);
  }
  update();
  return update;
}

/* ----------------------------------------------------------------------- */
/* Sync                                                                     */
/* ----------------------------------------------------------------------- */

function wireSync(header, onRefreshed) {
  const btn = header.querySelector('[data-sync]');
  const stamp = header.querySelector('[data-updated]');

  let lastUpdated = Date.now();

  const paintStamp = () => {
    if (stamp) stamp.textContent = `Updated ${relativeTime(lastUpdated)}`;
  };
  paintStamp();
  setInterval(paintStamp, 30000);

  if (!btn) return;

  const label = btn.querySelector('[data-sync-label]');
  const original = label ? label.textContent : '';

  const setState = (state, text) => {
    btn.dataset.state = state;
    btn.setAttribute('aria-busy', String(state === 'working'));
    btn.disabled = state === 'working';
    if (label && text !== undefined) label.textContent = text;
  };

  btn.addEventListener('click', async () => {
    if (btn.dataset.state === 'working') return;
    setState('working', 'Syncing');

    let ok = true;
    try {
      // The owning page re-renders from the data module. It may hand back a
      // promise; we wait for it rather than claiming success early.
      const event = new CustomEvent('afx:refresh', { detail: {}, cancelable: true });
      document.dispatchEvent(event);
      await Promise.resolve(event.detail.done);
    } catch (err) {
      ok = false;
    }

    if (!ok) {
      setState('error', 'Retry');
      if (window.afxToast) {
        window.afxToast('Sync Failed', 'The ledger view could not be refreshed.', 'danger');
      }
      setTimeout(() => setState('idle', original), 2400);
      return;
    }

    lastUpdated = Date.now();
    paintStamp();
    if (onRefreshed) onRefreshed();

    setState('done', 'Updated');
    if (window.afxToast) {
      window.afxToast(
        'Ledger Re-read',
        'Figures re-rendered from the current ledger snapshot.',
        'success'
      );
    }
    setTimeout(() => setState('idle', original), 1600);
  });
}

/* ----------------------------------------------------------------------- */
/* Period segment: arrow-key navigation                                     */
/* ----------------------------------------------------------------------- */

function wireSegmentKeys(header) {
  const seg = header.querySelector('[data-period]');
  if (!seg) return;

  seg.addEventListener('keydown', (e) => {
    const list = Array.from(seg.querySelectorAll('button[data-scope]'));
    const i = list.indexOf(document.activeElement);
    if (i === -1) return;
    let next = null;
    if (e.key === 'ArrowRight') next = list[(i + 1) % list.length];
    if (e.key === 'ArrowLeft') next = list[(i - 1 + list.length) % list.length];
    if (!next) return;
    e.preventDefault();
    next.focus();
    next.click();
  });
}

/* ----------------------------------------------------------------------- */

export function initPageHeader() {
  const header = document.querySelector('[data-page-header]');
  if (!header) return;

  const remeasure = wireScroll(header);
  wireSync(header, remeasure);
  wireSegmentKeys(header);
}
