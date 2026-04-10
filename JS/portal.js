/* ─────────────────────────────────────────────────────────────
   HAULXIFY CUSTOMER PORTAL — JavaScript
   ───────────────────────────────────────────────────────────── */

// ── TAB NAVIGATION ─────────────────────────────────────────
function switchTab(tabId) {
  // Deactivate all panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Activate target
  const panel = document.getElementById('tab-' + tabId);
  if (panel) panel.classList.add('active');

  const navItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (navItem) navItem.classList.add('active');

  // Update breadcrumb
  const labels = {
    dashboard:  'Dashboard',
    loads:      'Loads & Dispatch',
    tools:      'Tools',
    invoices:   'Invoices',
    billing:    'Billing',
    statements: 'Account Statements',
    paperwork:  'Paperwork',
    help:       'Help Center',
    settings:   'Settings',
    profile:    'My Profile',
  };
  const bc = document.getElementById('page-title');
  if (bc) bc.textContent = labels[tabId] || tabId;

  // Close sidebar on mobile
  closeSidebar();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Nav item clicks
document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    switchTab(item.dataset.tab);
  });
});

// ── SIDEBAR MOBILE ──────────────────────────────────────────
const sidebar  = document.getElementById('sidebar');
const overlay  = document.getElementById('sidebar-overlay');
const hamburger = document.getElementById('hamburger');
const sidebarClose = document.getElementById('sidebar-close');

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

hamburger?.addEventListener('click', openSidebar);
sidebarClose?.addEventListener('click', closeSidebar);
overlay?.addEventListener('click', closeSidebar);

// ── FILTER PILLS ────────────────────────────────────────────
document.querySelectorAll('.filter-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    pill.closest('.filter-bar').querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

// ── TOAST ───────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── SIGN OUT ────────────────────────────────────────────────
function signOut() {
  showToast('Signing out…');
  setTimeout(() => {
    localStorage.removeItem('hx_logged_in');
    sessionStorage.removeItem('hx_logged_in');
    window.location.href = 'login.html';
  }, 1200);
}

// ── THEME ───────────────────────────────────────────────────
function setTheme(theme, btn) {
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (theme === 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
  localStorage.setItem('hx-theme', theme);
}

// Load saved theme
(function() {
  const saved = localStorage.getItem('hx-theme');
  if (saved === 'light') {
    document.body.classList.add('light');
    const btn = document.querySelector('.theme-btn:last-child');
    if (btn) {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  }
})();

// ── CHARTS ──────────────────────────────────────────────────
function initCharts() {
  const isDark = !document.body.classList.contains('light');
  const gridColor   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const labelColor  = isDark ? 'rgba(240,244,255,0.4)'  : 'rgba(0,0,0,0.4)';
  Chart.defaults.color = labelColor;

  // Fleet Donut
  const donutCtx = document.getElementById('fleet-donut');
  if (donutCtx && !donutCtx._chartInstance) {
    donutCtx._chartInstance = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['In Transit', 'Available', 'Down'],
        datasets: [{
          data: [5, 3, 1],
          backgroundColor: ['#f97316', '#22c55e', '#ef4444'],
          borderColor: isDark ? '#162033' : '#ffffff',
          borderWidth: 3,
          hoverOffset: 6,
        }]
      },
      options: {
        cutout: '72%',
        plugins: { legend: { display: false }, tooltip: { callbacks: {
          label: ctx => ` ${ctx.label}: ${ctx.raw} truck${ctx.raw !== 1 ? 's' : ''}`
        }}},
        animation: { animateScale: true, animateRotate: true, duration: 900, easing: 'easeInOutQuart' }
      }
    });
  }

  // Revenue Bar
  const barCtx = document.getElementById('revenue-bar');
  if (barCtx && !barCtx._chartInstance) {
    barCtx._chartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
        datasets: [{
          label: 'Revenue ($)',
          data: [52000, 68000, 61000, 74000, 79000, 84200],
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return '#f97316';
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, '#f97316');
            gradient.addColorStop(1, 'rgba(249,115,22,0.1)');
            return gradient;
          },
          borderColor: '#f97316',
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          hoverBackgroundColor: '#fb923c',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ` $${ctx.raw.toLocaleString()}` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: labelColor } },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: labelColor,
              callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v)
            }
          }
        },
        animation: { duration: 1000, easing: 'easeInOutQuart' }
      }
    });
  }
}

// Init when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay so Chart.js CDN is loaded
  setTimeout(initCharts, 200);

  // Update greeting based on time
  const hour = new Date().getHours();
  const greeting = document.querySelector('.welcome-greeting');
  if (greeting) {
    if (hour < 12)      greeting.textContent = 'Good morning,';
    else if (hour < 17) greeting.textContent = 'Good afternoon,';
    else                greeting.textContent = 'Good evening,';
  }
});

// ── KEYBOARD SHORTCUTS ──────────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.querySelector('.topbar-search input')?.focus();
  }
});
