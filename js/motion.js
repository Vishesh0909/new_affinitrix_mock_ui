/**
 * AFINTRIX ERP — Motion System
 *
 * Built on `motion` (already a project dependency, framework-agnostic entry).
 * One easing scale and one duration scale, so every surface in the product
 * accelerates the same way.
 *
 * Everything here is a no-op under `prefers-reduced-motion: reduce` — elements
 * land in their final state immediately rather than animating.
 */

import { animate, inView, stagger } from 'motion';

export const EASE = {
  /** Default for entrances — decisive, no overshoot. */
  out: [0.16, 1, 0.3, 1],
  /** Interface elements that should feel physical (drawers, sheets). */
  spring: [0.34, 1.26, 0.64, 1],
  /** Exits: start fast, settle quietly. */
  in: [0.4, 0, 1, 1],
};

export const DURATION = {
  fast: 0.15,
  normal: 0.24,
  slow: 0.4,
  reveal: 0.55,
};

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Reveal elements as they enter the viewport, staggered in DOM order.
 * Used for the dashboard's sectioned entrance rather than a single page fade.
 */
export function revealOnScroll(selector = '[data-reveal]', options = {}) {
  const nodes = Array.from(document.querySelectorAll(selector));
  if (!nodes.length) return;

  if (prefersReducedMotion()) {
    nodes.forEach((n) => n.classList.add('is-revealed'));
    return;
  }

  nodes.forEach((node) => {
    // Hide from script, not from the stylesheet: if this module ever fails to
    // load, the content is still on screen rather than invisible.
    node.style.opacity = '0';
    inView(
      node,
      (entry) => {
        const target = entry.target || entry;
        const children = target.querySelectorAll('[data-reveal-item]');
        animate(
          target,
          { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0px)'] },
          { duration: DURATION.reveal, easing: EASE.out }
        );
        if (children.length) {
          animate(
            children,
            { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0px)'] },
            { duration: DURATION.slow, delay: stagger(0.055, { startDelay: 0.08 }), easing: EASE.out }
          ).finished.then(() => {
            children.forEach((c) => {
              c.style.opacity = '';
              c.style.transform = '';
            });
          }).catch(() => {});
        }
        // Hand the element back to the stylesheet; a lingering inline
        // transform would override any CSS hover state.
        target.style.opacity = '';
        target.style.transform = '';
        target.classList.add('is-revealed');
        // Reveal once; re-animating on every scroll pass is noise.
        return () => {};
      },
      { amount: options.amount ?? 0.15, margin: '0px 0px -40px 0px' }
    );
  });
}

/**
 * Count a number up to its final value. Formatting is delegated so currency,
 * compact and percentage counters all share this one implementation.
 *
 * @param {HTMLElement} node
 * @param {number} to
 * @param {(v:number)=>string} format
 */
export function countUp(node, to, format, opts = {}) {
  const from = Number(opts.from ?? 0);
  if (prefersReducedMotion()) {
    node.textContent = format(to);
    return;
  }
  // Reserve the final width first, so the counter cannot reflow its neighbours.
  node.textContent = format(to);
  node.style.minWidth = `${node.offsetWidth}px`;
  node.style.display = 'inline-block';

  animate(from, to, {
    duration: opts.duration ?? 1.1,
    easing: EASE.out,
    delay: opts.delay ?? 0,
    onUpdate: (v) => {
      node.textContent = format(v);
    },
  });
}

/**
 * Run a counter the first time its element is on screen.
 *
 * Deliberately uses a native IntersectionObserver rather than `inView`: this
 * node is re-created whenever the figure is re-rendered (e.g. on a period
 * change), and it is often inserted already-visible. A native observer reports
 * an already-intersecting target on first observe; the rAF defers the check
 * until layout exists, and the timeout guarantees the value is never left
 * sitting at its placeholder.
 */
export function countUpOnView(node, to, format, opts = {}) {
  if (prefersReducedMotion()) {
    node.textContent = format(to);
    return;
  }

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    countUp(node, to, format, opts);
  };

  // Reading the box forces layout, so a node inserted during this same tick
  // still reports real geometry. If it is already on screen there is nothing
  // to wait for — start now rather than deferring to a frame callback.
  const rect = node.getBoundingClientRect();
  const viewportH = window.innerHeight || document.documentElement.clientHeight;
  if (rect.height > 0 && rect.top < viewportH && rect.bottom > 0) {
    start();
    return;
  }

  if (typeof IntersectionObserver === 'undefined') {
    start();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        start();
      }
    },
    { threshold: 0.2 }
  );
  io.observe(node);

  // Safety net, scheduled unconditionally: the figure must never be left
  // showing its placeholder because an observer did not report.
  setTimeout(() => {
    if (!started) {
      io.disconnect();
      start();
    }
  }, 800);
}

/**
 * Slide a pill indicator under the active item of a tab/segment control.
 * Measured from the live DOM so it stays correct across breakpoints.
 */
export function moveIndicator(indicator, target) {
  if (!indicator || !target) return;
  const parent = indicator.parentElement;
  if (!parent) return;

  const p = parent.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const x = t.left - p.left;
  const w = t.width;

  if (prefersReducedMotion() || indicator.dataset.ready !== 'true') {
    indicator.style.transform = `translateX(${x}px)`;
    indicator.style.width = `${w}px`;
    indicator.dataset.ready = 'true';
    return;
  }

  animate(
    indicator,
    { transform: `translateX(${x}px)`, width: `${w}px` },
    { duration: DURATION.normal, easing: EASE.out }
  );
}

/** Entrance for a toast stack item. */
export function enterToast(node) {
  if (prefersReducedMotion()) return;
  animate(
    node,
    { opacity: [0, 1], transform: ['translateX(18px) scale(.97)', 'translateX(0) scale(1)'] },
    { duration: DURATION.normal, easing: EASE.spring }
  );
}

export function exitToast(node) {
  if (prefersReducedMotion()) return Promise.resolve();
  return animate(
    node,
    { opacity: [1, 0], transform: ['translateX(0)', 'translateX(18px)'] },
    { duration: DURATION.fast, easing: EASE.in }
  ).finished;
}
