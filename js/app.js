/**
 * AFINTRIX ERP — Application Controller & Interaction Engine (V2)
 * High-performance vanilla TypeScript/JS powering the Studio Deck shell,
 * real-time table sorting, live filters, command palette (Ctrl+K),
 * modal drawers, interactive line-item calculations, and micro-motion.
 */

import { enterOverlay, enterToast, exitToast, moveIndicator, pressFeedback } from './motion.js';

(function () {
  'use strict';

  // Crisp Enterprise Line Icons
  const ICONS = {
    dashboard: '<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>',
    accounting: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>',
    chart: '<path d="M3 3v18h18v-2H5V3H3zm4 12h2v4H7v-4zm4-6h2v10h-2V9zm4 4h2v6h-2v-6zm4-8h2v14h-2V5z"/>',
    purchasing: '<path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>',
    people: '<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>',
    portal: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/>',
    report: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>',
    check: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
    bell: '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>',
    sun: '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/>',
    moon: '<path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>',
    search: '<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>',
    menu: '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>',
    chevronLeft: '<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>',
    chevronRight: '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>',
    home: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
    layers: '<path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9.07l-9-7-9 7 1.63 1.27L12 16z"/>',
    plus: '<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>',
    download: '<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>'
  };

  function svg(name, size = 18) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">${ICONS[name] || ''}</svg>`;
  }
  window.afxSvg = svg;

  // Global Navigation Taxonomy
  const NAV_STRUCTURE = [
    {
      group: 'Core Financials',
      items: [
        { id: 'executive', label: 'Executive Summary', icon: 'layers', href: 'executive.html' },
        { id: 'dashboard', label: 'Financial Overview', icon: 'dashboard', href: 'index.html' },
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
        { id: 'landing', label: 'Platform Welcome', icon: 'home', href: 'landing.html' }
      ]
    }
  ];

  // Command Palette Items
  const COMMANDS = [
    {
      group: 'Workspaces',
      items: [
        { title: 'Executive Summary (Enterprise Roll-up)', href: 'executive.html', key: 'G X' },
        { title: 'Accounting Overview Dashboard', href: 'index.html', key: 'G D' },
        { title: 'Purchase Orders Procurement Deck', href: 'list.html', key: 'G P' },
        { title: 'New Purchase Order Studio', href: 'form.html', key: 'N O' },
        { title: 'Trial Balance & Financial Ledger', href: 'report.html', key: 'G T' },
        { title: 'Leave Application Decision Center', href: 'approval.html', key: 'G A' },
        { title: 'Employee Self-Service Portal', href: 'portal.html', key: 'G S' },
        { title: 'Employee Personnel File (Hanna Baptista)', href: 'record.html', key: 'G E' },
        { title: 'AFINTRIX Enterprise Welcome Portal', href: 'landing.html', key: 'G H' }
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
    const suffix = t === 'dark' ? '-dark' : '';
    document.querySelectorAll('.brand-full-logo').forEach(img => {
      img.src = `assets/afintrix-logo${suffix}.png`;
    });
    document.querySelectorAll('.brand-symbol-logo').forEach(img => {
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
    enterOverlay(cmdk, 'modal');
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
        <div class="sidebar-brand-deck">
          <a href="landing.html" class="brand-link" title="AFINTRIX ERP Platform">
            <img src="assets/afintrix-logo.png" alt="AFINTRIX" class="brand-full-logo">
            <img src="assets/afintrix-symbol.png" alt="AFINTRIX" class="brand-symbol-logo">
          </a>
          <button class="sidebar-toggle-btn" id="sidebarToggleBtn" title="Collapse / Expand Workspace (Ctrl+B)">
            ${svg('chevronLeft', 16)}
          </button>
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

      const breadcrumbHtml = `
        <div class="breadcrumbs-deck">
          ${parts.map((p, i) => {
            const isLast = i === parts.length - 1;
            return isLast
              ? `<span class="current-crumb">${p.trim()}</span>`
              : `<a href="#">${p.trim()}</a><span class="slash">/</span>`;
          }).join('')}
        </div>
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
            <button class="command-search-trigger" id="cmdkTriggerBtn">
              ${svg('search', 15)}
              <span>Search or jump to...</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button class="action-icon-btn theme-toggle-trigger" id="themeToggleTrigger" title="Toggle Light / Dark Mode">
              ${svg('moon', 17)}
            </button>
            <button class="action-icon-btn" id="notifBellBtn" title="Alerts &amp; Tasks">
              ${svg('bell', 17)}
              <span class="badge-dot"></span>
            </button>
            <a href="portal.html" class="btn btn-secondary btn-sm" style="gap:6px" title="Employee Self-Service">
              <span style="width:8px;height:8px;border-radius:99px;background:var(--pos)"></span>
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
    document.getElementById('sidebarToggleBtn')?.addEventListener('click', () => {
      appEl.classList.toggle('nav-collapsed');
    });

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
      pressFeedback(trigger);
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
        if (action === 'toggleNav') appEl.classList.toggle('nav-collapsed');
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

      // Tactile press feedback on buttons
      const pressed = e.target.closest('.btn, .action-icon-btn');
      if (pressed) pressFeedback(pressed);

      // Modal / Drawer Openers
      const op = e.target.closest('[data-open]');
      if (op) {
        e.preventDefault();
        const id = op.dataset.open;
        const target = document.getElementById(id);
        if (target) {
          document.getElementById('overlayScrim')?.classList.add('open');
          target.classList.add('open', 'on');
          enterOverlay(target, target.classList.contains('saas-drawer') ? 'drawer' : 'modal');
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
        appEl.classList.toggle('nav-collapsed');
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

  // Boot
  function boot() {
    // Theme is applied before anything else so the first paint is correct,
    // and runs on every page — including those without the app shell.
    setTheme(getTheme());
    buildStudioShell();
    wireInteractions();
    positionNavRail();
    window.addEventListener('resize', positionNavRail);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
