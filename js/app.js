/**
 * AFINTRIX ERP — Application Controller & Interaction Engine (V2)
 * High-performance vanilla TypeScript/JS powering the Studio Deck shell,
 * real-time table sorting, live filters, command palette (Ctrl+K),
 * modal drawers, interactive line-item calculations, and micro-motion.
 */

import { enterToast, exitToast, moveIndicator } from './motion.js';
import { percentCells } from './visuals.js';

(function () {
  'use strict';

  // Crisp Enterprise Line Icons
  // Outline icon set — 24x24, stroked rather than filled, so the weight sits
  // alongside the UI type instead of shouting over it.
  const ICONS = {
    executive: '<path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z"/><path d="m3 12 9 4.5L21 12"/><path d="m3 16.5 9 4.5 9-4.5"/>',
    dashboard: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
    accounting: '<circle cx="12" cy="12" r="9"/><path d="M12 6.5v11"/><path d="M14.8 9.4A2.4 2.4 0 0 0 12.4 8h-1a2.2 2.2 0 0 0 0 4.4h1.2a2.2 2.2 0 0 1 0 4.4h-1a2.4 2.4 0 0 1-2.4-1.4"/>',
    chart: '<path d="M3 3v16.4A1.6 1.6 0 0 0 4.6 21H21"/><path d="M7.5 16.5v-3M12 16.5v-7M16.5 16.5v-5"/>',
    purchasing: '<circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17.5" cy="19.5" r="1.4"/><path d="M2.5 3h2.4l2.3 11.1a1.8 1.8 0 0 0 1.8 1.4h8.3a1.8 1.8 0 0 0 1.8-1.4L20.5 7H5.6"/>',
    people: '<path d="M15.5 20.5v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.7v1.8"/><circle cx="9.25" cy="7.5" r="3.5"/><path d="M21 20.5v-1.8a3.6 3.6 0 0 0-2.7-3.48"/><path d="M15.5 4.2a3.6 3.6 0 0 1 0 6.96"/>',
    portal: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18"/><path d="M9 9v12"/>',
    report: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13.5h6M9 17h4"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8.4 12.2 2.4 2.4 4.8-5.2"/>',
    bell: '<path d="M18 8.6a6 6 0 1 0-12 0c0 5.6-2.4 7-2.4 7h16.8s-2.4-1.4-2.4-7"/><path d="M13.7 19.4a2 2 0 0 1-3.4 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.5 1.5M17.9 17.9l1.5 1.5M2.5 12h2M19.5 12h2M4.6 19.4l1.5-1.5M17.9 6.1l1.5-1.5"/>',
    moon: '<path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.85-3.85"/>',
    menu: '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
    chevronLeft: '<path d="m14.5 6-6 6 6 6"/>',
    chevronRight: '<path d="m9.5 6 6 6-6 6"/>',
    home: '<path d="M3 10.4 12 3l9 7.4"/><path d="M5.6 9.3V19a2 2 0 0 0 2 2H10v-5.6h4V21h2.4a2 2 0 0 0 2-2V9.3"/>',
    layers: '<path d="M12 3 3 7.5l9 4.5 9-4.5L12 3Z"/><path d="m3 12 9 4.5L21 12"/><path d="m3 16.5 9 4.5 9-4.5"/>',
    plus: '<path d="M12 5.5v13M5.5 12h13"/>',
    download: '<path d="M12 3.5v11.5"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 20.5h16"/>',
    sync: '<path d="M20.5 11.5a8.5 8.5 0 0 0-14.6-5.3L3 9"/><path d="M3.5 12.5a8.5 8.5 0 0 0 14.6 5.3L21 15"/><path d="M3 4.5V9h4.5M21 19.5V15h-4.5"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.8v5"/><path d="M12 16.2h.01"/>',
    bank: '<path d="m3 9.5 9-5.5 9 5.5"/><path d="M4.5 9.5V18M9.5 9.5V18M14.5 9.5V18M19.5 9.5V18"/><path d="M2.5 20.5h19"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>'
  };

  function svg(name, size = 18) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }
  window.afxSvg = svg;

  // Global Navigation Taxonomy
  const NAV_STRUCTURE = [
    {
      group: 'Core Financials',
      items: [
        { id: 'executive', label: 'Executive Summary', icon: 'executive', href: 'executive.html' },
        { id: 'dashboard', label: 'Financial Overview', icon: 'dashboard', href: 'overview.html' },
        { id: 'report', label: 'Trial Balance & Ledger', icon: 'report', href: 'report.html' }
      ]
    },
    {
      group: 'Procurement & Stock',
      items: [
        { id: 'list', label: 'Purchase Orders', icon: 'purchasing', href: 'list.html', count: '8' },
        { id: 'form', label: 'Create Order', icon: 'plus', href: 'form.html' }
      ]
    },
    {
      group: 'People & Operations',
      items: [
        { id: 'record', label: 'Personnel Dossier', icon: 'people', href: 'record.html' },
        { id: 'approval', label: 'Approval Governance', icon: 'check', href: 'approval.html', count: '5' },
        { id: 'portal-home', label: 'Self-Service Portal', icon: 'portal', href: 'portal.html' }
      ]
    },
    {
      group: 'System & Landing',
      items: [
        { id: 'landing', label: 'Platform Welcome', icon: 'home', href: 'index.html' }
      ]
    }
  ];

  // Command Palette Items
  const COMMANDS = [
    {
      group: 'Workspaces',
      items: [
        { title: 'Executive Summary (Enterprise Roll-up)', href: 'executive.html', key: 'G X' },
        { title: 'Accounting Overview Dashboard', href: 'overview.html', key: 'G D' },
        { title: 'Purchase Orders Procurement Deck', href: 'list.html', key: 'G P' },
        { title: 'New Purchase Order Studio', href: 'form.html', key: 'N O' },
        { title: 'Trial Balance & Financial Ledger', href: 'report.html', key: 'G T' },
        { title: 'Leave Application Decision Center', href: 'approval.html', key: 'G A' },
        { title: 'Employee Self-Service Portal', href: 'portal.html', key: 'G S' },
        { title: 'Employee Personnel File (Hanna Baptista)', href: 'record.html', key: 'G E' },
        { title: 'AFINTRIX Enterprise Welcome Portal', href: 'index.html', key: 'G H' }
      ]
    },
    {
      group: 'Quick Operations',
      items: [
        { title: 'Record New Ledger Entry', action: 'openNewEntry', key: 'N E' },
        { title: 'Switch Light / Dark Theme', action: 'toggleTheme', key: 'T T' },
        { title: 'Toggle Navigation Workspace Width', action: 'toggleNav', key: 'Ctrl B' },
        { title: 'Export Financial Audit Pack (XLSX)', action: 'exportAudit', key: 'Ctrl E' }
      ]
    }
  ];

  // Theme Storage
  function getTheme() {
    try {
      return localStorage.getItem('afx-theme') || 'light';
    } catch (e) {
      return 'light';
    }
  }

  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('afx-theme', t);
    } catch (e) {}
    document.querySelectorAll('.theme-toggle-trigger').forEach(btn => {
      btn.innerHTML = svg(t === 'dark' ? 'sun' : 'moon', 17);
    });
    // `.is-on-dark` logos sit on the sidebar's white plate, which does not
    // follow the app theme, so they keep the original blue artwork in both
    // modes and must be skipped by the swap.
    const suffix = t === 'dark' ? '-dark' : '';
    document.querySelectorAll('.brand-full-logo:not(.is-on-dark)').forEach(img => {
      img.src = `assets/afintrix-logo${suffix}.png`;
    });
    document.querySelectorAll('.brand-symbol-logo:not(.is-on-dark)').forEach(img => {
      img.src = `assets/afintrix-symbol${suffix}.png`;
    });
  }

  // Toast Notification Dispatcher
  function toast(title, desc = '', type = 'info') {
    let container = document.getElementById('afxToastDeck');
    if (!container) {
      container = document.createElement('div');
      container.id = 'afxToastDeck';
      container.className = 'saas-toast-deck';
      document.body.appendChild(container);
    }

    const t = document.createElement('div');
    const typeClass = type === 'p' || type === 'success' ? 'success' :
                      type === 'n' || type === 'danger' ? 'danger' :
                      type === 'w' || type === 'warning' ? 'warning' : 'info';

    t.className = `toast-box ${typeClass}`;
    t.innerHTML = `
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${desc ? `<div class="toast-desc">${desc}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss">&times;</button>
    `;

    container.appendChild(t);
    enterToast(t);

    let killed = false;
    const kill = () => {
      if (killed) return;
      killed = true;
      Promise.resolve(exitToast(t)).then(() => t.remove());
    };

    t.querySelector('.toast-close').addEventListener('click', kill);
    const timer = setTimeout(kill, 4200);
    // Pause the dismissal timer while the pointer rests on the toast.
    t.addEventListener('mouseenter', () => clearTimeout(timer));
  }
  window.afxToast = toast;

  // Overlay Dismissal
  function closeAll() {
    document.getElementById('overlayScrim')?.classList.remove('open');
    document.querySelectorAll('.saas-modal.open, .saas-drawer.open, .saas-cmdk.open').forEach(el => {
      el.classList.remove('open');
      // Overlays hide through `opacity` on the base class. Any inline opacity
      // or transform left behind by a script would outrank that and pin the
      // panel open, so clear them as we close.
      el.style.opacity = '';
      el.style.transform = '';
    });
    document.querySelector('.app')?.classList.remove('mobile-nav-open');
  }
  window.afxClose = closeAll;

  // Command Palette
  function openCmdk() {
    const scrim = document.getElementById('overlayScrim');
    const cmdk = document.getElementById('cmdkModal');
    if (!scrim || !cmdk) return;

    scrim.classList.add('open');
    cmdk.classList.add('open');
    const input = document.getElementById('cmdkQueryInput');
    if (input) {
      input.value = '';
      renderCmdkList('');
      setTimeout(() => input.focus(), 40);
    }
  }

  function renderCmdkList(q) {
    const list = document.getElementById('cmdkResultsList');
    if (!list) return;

    q = q.toLowerCase().trim();
    let html = '';
    let matchCount = 0;

    COMMANDS.forEach(grp => {
      const hits = grp.items.filter(it => !q || it.title.toLowerCase().includes(q));
      if (!hits.length) return;
      matchCount += hits.length;

      html += `<div class="cmdk-group-title">${grp.group}</div>`;
      hits.forEach(it => {
        if (it.href) {
          html += `
            <a href="${it.href}" class="cmdk-row">
              <span>${it.title}</span>
              ${it.key ? `<span class="cmdk-key-hint">${it.key}</span>` : ''}
            </a>
          `;
        } else {
          html += `
            <div class="cmdk-row" data-action="${it.action}">
              <span>${it.title}</span>
              ${it.key ? `<span class="cmdk-key-hint">${it.key}</span>` : ''}
            </div>
          `;
        }
      });
    });

    list.innerHTML = matchCount ? html : `<div style="padding:28px;text-align:center;color:var(--ink-muted)">No matching records for &ldquo;${q}&rdquo;</div>`;
  }

  // Shell Builder
  function buildStudioShell() {
    const appEl = document.querySelector('.app');
    if (!appEl) return;

    const currentSection = appEl.dataset.section || '';

    // 1. Sidebar HTML
    const sidebar = `
      <aside class="app-sidebar" id="appSidebar">
        <button class="sidebar-toggle-btn" id="sidebarToggleBtn"
                aria-label="Collapse or expand navigation (Ctrl+B)"
                title="Collapse / Expand Workspace (Ctrl+B)">
          ${svg('chevronLeft', 15)}
        </button>

        <div class="sidebar-brand-deck">
          <a href="index.html" class="brand-link" title="AFINTRIX ERP Platform">
            <img src="assets/afintrix-logo.png" alt="AFINTRIX" class="brand-full-logo is-on-dark">
            <img src="assets/afintrix-symbol.png" alt="AFINTRIX" class="brand-symbol-logo is-on-dark">
          </a>
        </div>

        <div class="sidebar-org-switcher">
          <div class="org-pill">
            <div class="org-avatar-badge">AD</div>
            <div class="org-info">
              <div class="org-name">Afintrix (Demo) Entity</div>
              <div class="org-meta">Dhaka AD &middot; FY 2026-2027</div>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav-scroll" aria-label="Module Navigation">
          <span class="nav-active-rail" aria-hidden="true"></span>
          ${NAV_STRUCTURE.map(group => `
            <div class="nav-section-header">${group.group}</div>
            ${group.items.map(item => `
              <a href="${item.href}" class="nav-item-link ${item.id === currentSection ? 'active' : ''}" title="${item.label}">
                <span class="nav-icon">${svg(item.icon, 18)}</span>
                <span>${item.label}</span>
                ${item.count ? `<span class="nav-count-pill">${item.count}</span>` : ''}
              </a>
            `).join('')}
          `).join('')}
        </nav>

        <div class="sidebar-footer-card">
          <img src="assets/avatar_hanna.jpg" alt="Hanna Baptista" class="user-thumb" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div class="user-thumb-fallback" style="display:none">HB</div>
          <div class="user-meta-info">
            <div class="user-name">Hanna Baptista</div>
            <div class="user-role-label">Senior Accounts Officer</div>
          </div>
        </div>
      </aside>
    `;

    appEl.insertAdjacentHTML('afterbegin', sidebar);

    // 2. Main Viewport Top Bar
    const mainEl = appEl.querySelector('.main') || appEl.querySelector('main');
    if (mainEl) {
      mainEl.classList.add('app-main');
      const crumbEl = mainEl.querySelector('[data-crumb]');
      const rawCrumb = crumbEl ? crumbEl.dataset.crumb : 'AFINTRIX / Enterprise';
      const parts = rawCrumb.split('/');

      // The active nav entry supplies the crumb's leading mark, so the trail
      // always shows which module you are inside.
      const activeNav = NAV_STRUCTURE
        .flatMap(g => g.items)
        .find(item => item.id === currentSection);

      const breadcrumbHtml = `
        <nav class="breadcrumbs-deck" aria-label="Breadcrumb">
          <span class="crumb-mark" aria-hidden="true">${svg(activeNav ? activeNav.icon : 'layers', 15)}</span>
          ${parts.map((p, i) => {
            const isLast = i === parts.length - 1;
            return isLast
              ? `<span class="current-crumb" aria-current="page">${p.trim()}</span>`
              : `<a href="#">${p.trim()}</a><span class="slash" aria-hidden="true">${svg('chevronRight', 13)}</span>`;
          }).join('')}
        </nav>
      `;

      const topBar = `
        <header class="top-bar-deck">
          <div class="top-bar-left">
            <button class="action-icon-btn mobile-only" id="mobileNavTrigger" aria-label="Toggle Navigation">
              ${svg('menu', 18)}
            </button>
            ${breadcrumbHtml}
          </div>

          <div class="top-bar-right">
            <button class="command-search-trigger" id="cmdkTriggerBtn" aria-label="Search or jump to a workspace">
              <span class="search-glyph">${svg('search', 15)}</span>
              <span class="search-label">Search or jump to...</span>
              <kbd>Ctrl K</kbd>
            </button>

            <div class="top-bar-cluster">
              <button class="action-icon-btn theme-toggle-trigger" id="themeToggleTrigger" title="Toggle Light / Dark Mode" aria-label="Toggle light or dark mode">
                ${svg('moon', 17)}
              </button>
              <button class="action-icon-btn" id="notifBellBtn" title="Alerts &amp; Tasks" aria-label="Alerts and tasks">
                ${svg('bell', 17)}
                <span class="badge-dot"></span>
              </button>
            </div>

            <span class="top-bar-divider" aria-hidden="true"></span>

            <a href="portal.html" class="btn btn-secondary btn-sm top-bar-portal" title="Employee Self-Service">
              <span class="portal-status" aria-hidden="true"></span>
              <span>Portal</span>
            </a>
          </div>
        </header>
      `;

      mainEl.insertAdjacentHTML('afterbegin', topBar);
    }

    // 3. Mount Global Overlays
    const overlays = `
      <div class="overlay-scrim" id="overlayScrim"></div>
      <div class="saas-cmdk" id="cmdkModal">
        <div class="cmdk-input-bar">
          ${svg('search', 18)}
          <input type="text" id="cmdkQueryInput" placeholder="Jump to workspace, invoice, employee, or action..." autocomplete="off">
        </div>
        <div class="cmdk-list" id="cmdkResultsList"></div>
      </div>
      <div class="saas-toast-deck" id="afxToastDeck"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', overlays);
  }

  // Live Table Sorter
  function initSorting() {
    document.querySelectorAll('table.saas-table, table.data-table').forEach(table => {
      const headers = table.querySelectorAll('thead th.sortable');
      headers.forEach(th => {
        const colIdx = Array.prototype.indexOf.call(th.parentNode.children, th);
        if (!th.querySelector('.sort-arrow')) {
          th.insertAdjacentHTML('beforeend', '<span class="sort-arrow">▲</span>');
        }

        th.addEventListener('click', () => {
          const isAsc = th.classList.contains('asc');
          headers.forEach(h => h.classList.remove('asc', 'desc'));
          th.classList.add(isAsc ? 'desc' : 'asc');

          const tbody = table.querySelector('tbody');
          if (!tbody) return;

          const rows = Array.from(tbody.querySelectorAll('tr'));
          rows.sort((a, b) => {
            const cellA = a.children[colIdx];
            const cellB = b.children[colIdx];
            if (!cellA || !cellB) return 0;

            const valA = cellA.dataset.sort !== undefined ? cellA.dataset.sort : cellA.textContent.trim();
            const valB = cellB.dataset.sort !== undefined ? cellB.dataset.sort : cellB.textContent.trim();

            const numA = parseFloat(valA.replace(/[^0-9.-]/g, ''));
            const numB = parseFloat(valB.replace(/[^0-9.-]/g, ''));

            if (!isNaN(numA) && !isNaN(numB)) {
              return isAsc ? numB - numA : numA - numB;
            }
            return isAsc ? valB.localeCompare(valA) : valA.localeCompare(valB);
          });

          rows.forEach(r => tbody.appendChild(r));
        });
      });
    });
  }

  // Live Filter Input
  function initFilter() {
    document.querySelectorAll('[data-filter]').forEach(input => {
      const table = document.querySelector(input.dataset.filter);
      if (!table) return;

      input.addEventListener('input', () => {
        const query = input.value.toLowerCase().trim();
        let matches = 0;

        table.querySelectorAll('tbody tr').forEach(row => {
          const text = row.textContent.toLowerCase();
          const hit = !query || text.includes(query);
          row.style.display = hit ? '' : 'none';
          if (hit) matches++;
        });

        const countEl = document.querySelector('[data-count]');
        if (countEl && countEl.dataset.count) {
          countEl.textContent = countEl.dataset.count.replace('{n}', matches);
        }
      });
    });
  }

  // Wire Interactions
  function wireInteractions() {
    const appEl = document.querySelector('.app');

    // Sidebar collapse
    document.getElementById('sidebarToggleBtn')?.addEventListener('click', () => toggleNav());

    // Mobile nav
    document.getElementById('mobileNavTrigger')?.addEventListener('click', () => {
      appEl.classList.toggle('mobile-nav-open');
      document.getElementById('overlayScrim')?.classList.toggle('open');
    });

    // Theme toggle — delegated by class so the landing header's own trigger
    // works too, not just the app shell's.
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.theme-toggle-trigger');
      if (!trigger) return;
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
      toast('Display Theme Updated', `Switched to ${getTheme()} mode`, 'info');
    });

    // Command palette
    document.getElementById('cmdkTriggerBtn')?.addEventListener('click', openCmdk);
    document.getElementById('cmdkQueryInput')?.addEventListener('input', (e) => {
      renderCmdkList(e.target.value);
    });

    document.getElementById('cmdkResultsList')?.addEventListener('click', (e) => {
      const act = e.target.closest('[data-action]');
      if (act) {
        const action = act.dataset.action;
        closeAll();
        if (action === 'toggleTheme') setTheme(getTheme() === 'dark' ? 'light' : 'dark');
        if (action === 'toggleNav') toggleNav();
        if (action === 'openNewEntry') {
          const m = document.getElementById('mNew');
          if (m) {
            document.getElementById('overlayScrim')?.classList.add('open');
            m.classList.add('open');
          }
        }
        if (action === 'exportAudit') toast('Audit Pack Generated', 'Trial Balance and General Ledger exporting as XLSX.', 'success');
      }
    });

    // Tab buttons
    document.querySelectorAll('.page-nav-tabs, .tabs').forEach(bar => {
      bar.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        bar.querySelectorAll('button').forEach(b => b.classList.remove('active', 'on'));
        btn.classList.add('active', 'on');

        const panel = btn.dataset.tab;
        if (panel) {
          document.querySelectorAll('[data-panel]').forEach(p => {
            p.hidden = p.dataset.panel !== panel;
          });
        }
      });
    });

    // Checkbox selections & Row toggles
    document.addEventListener('click', (e) => {
      // Custom checkboxes
      const cbx = e.target.closest('.saas-checkbox, .cbx');
      if (cbx) {
        if (cbx.dataset.all !== undefined) {
          const table = cbx.closest('table');
          const check = !cbx.classList.contains('checked') && !cbx.classList.contains('on');
          cbx.classList.toggle('checked', check);
          cbx.classList.toggle('on', check);
          cbx.innerHTML = check ? '✓' : '';

          table.querySelectorAll('tbody .saas-checkbox, tbody .cbx').forEach(c => {
            c.classList.toggle('checked', check);
            c.classList.toggle('on', check);
            c.innerHTML = check ? '✓' : '';
            c.closest('tr')?.classList.toggle('selected', check);
          });
        } else {
          const check = !cbx.classList.contains('checked') && !cbx.classList.contains('on');
          cbx.classList.toggle('checked', check);
          cbx.classList.toggle('on', check);
          cbx.innerHTML = check ? '✓' : '';
          cbx.closest('tr')?.classList.toggle('selected', check);
        }

        const count = document.querySelectorAll('tbody tr.selected').length;
        document.querySelectorAll('[data-selcount]').forEach(el => {
          el.textContent = count ? `${count} selected` : '';
          el.style.display = count ? 'inline-flex' : 'none';
        });
        return;
      }

      // Filter chip remove
      const chipBtn = e.target.closest('.chip-remove-btn, .chip button');
      if (chipBtn) {
        const chip = chipBtn.closest('.filter-chip, .chip');
        if (chip) {
          chip.style.display = 'none';
          toast('Filter Cleared', 'Query parameter removed from statement view', 'info');
        }
        return;
      }

      // Collapsible Tree Rows (Trial Balance)
      const treeToggle = e.target.closest('.tree-toggle-icon, .chev');
      if (treeToggle) {
        const isOpen = treeToggle.textContent.trim() === '▾';
        treeToggle.textContent = isOpen ? '▸' : '▾';
        const lvl = parseInt(treeToggle.dataset.level || '0', 10);
        let nextRow = treeToggle.closest('tr')?.nextElementSibling;
        while (nextRow) {
          const lvlEl = nextRow.querySelector('[data-lvl]');
          const rLvl = lvlEl ? parseInt(lvlEl.dataset.lvl, 10) : 99;
          if (rLvl <= lvl) break;
          nextRow.style.display = isOpen ? 'none' : '';
          nextRow = nextRow.nextElementSibling;
        }
        return;
      }

      // Modal / Drawer Openers
      const op = e.target.closest('[data-open]');
      if (op) {
        e.preventDefault();
        const id = op.dataset.open;
        const target = document.getElementById(id);
        if (target) {
          document.getElementById('overlayScrim')?.classList.add('open');
          target.classList.add('open', 'on');
          // Move focus into the dialog so keyboard users land inside it.
          const focusable = target.querySelector(
            'input, select, textarea, button:not([data-close])'
          );
          if (focusable) setTimeout(() => focusable.focus(), 60);
        }
        return;
      }

      // Closers
      if (e.target.closest('[data-close]')) {
        e.preventDefault();
        closeAll();
        return;
      }

      // Toasts
      const toastTrigger = e.target.closest('[data-toast]');
      if (toastTrigger) {
        e.preventDefault();
        const parts = toastTrigger.dataset.toast.split('|');
        toast(parts[0], parts[1] || '', parts[2] || 'info');
        if (toastTrigger.dataset.closeAfter !== undefined) {
          closeAll();
        }
      }
    });

    // Scrim click closes
    document.getElementById('overlayScrim')?.addEventListener('click', closeAll);

    // Global Hotkeys
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCmdk();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleNav();
      }
      if (e.key === 'Escape') {
        closeAll();
      }
    });

    initSorting();
    initFilter();
  }

  /** Park the sliding rail behind whichever nav item is active. */
  function positionNavRail() {
    const nav = document.querySelector('.sidebar-nav-scroll');
    if (!nav) return;
    const rail = nav.querySelector('.nav-active-rail');
    const active = nav.querySelector('.nav-item-link.active');
    if (!rail || !active) return;
    rail.style.top = `${active.offsetTop}px`;
    rail.style.height = `${active.offsetHeight}px`;
    rail.style.opacity = '1';
  }

  /**
   * Collapsing hides the section headers, which shifts every nav item, so the
   * rail has to be re-measured — once immediately and again once the width
   * transition has settled.
   */
  function toggleNav() {
    const appEl = document.querySelector('.app');
    if (!appEl) return;
    appEl.classList.toggle('nav-collapsed');
    positionNavRail();
    const sidebar = document.getElementById('appSidebar');
    if (sidebar) {
      sidebar.addEventListener('transitionend', positionNavRail, { once: true });
    }
    // Belt and braces for browsers that coalesce the transition event away.
    setTimeout(positionNavRail, 260);
  }

  /**
   * Feed the pointer position into --mx/--my so every button's radial
   * highlight follows the cursor. Delegated on the document and throttled to
   * one frame, so it costs a single rAF per move no matter how many buttons
   * are on screen.
   */
  function wirePointerGlow() {
    let frame = 0;
    let pending = null;

    document.addEventListener('pointermove', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      pending = { btn, x: e.clientX, y: e.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pending) return;
        const rect = pending.btn.getBoundingClientRect();
        pending.btn.style.setProperty('--mx', `${pending.x - rect.left}px`);
        pending.btn.style.setProperty('--my', `${pending.y - rect.top}px`);
      });
    }, { passive: true });
  }

  // Boot
  function boot() {
    // Theme is applied before anything else so the first paint is correct,
    // and runs on every page — including those without the app shell.
    setTheme(getTheme());
    buildStudioShell();
    wireInteractions();
    positionNavRail();
    wirePointerGlow();
    // Purely additive: a cell whose text is not a bare percentage is skipped.
    percentCells(document);
    window.addEventListener('resize', positionNavRail);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
