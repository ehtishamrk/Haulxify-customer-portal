/* =================================================================
   HAULXIFY CUSTOMER PORTAL — portal.js
   Firebase-powered — all data loaded from Firestore
   ================================================================= */

const db   = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let customerData = null;

// ── AUTH GUARD ──────────────────────────────────────────────
auth.onAuthStateChanged(function(user) {
  if (!user) {
    window.location.href = 'https://app.haulxify.com/login.html';
    return;
  }
  currentUser = user;
  loadCustomerData(user.uid);
});

// ── LOAD ALL CUSTOMER DATA ──────────────────────────────────
async function loadCustomerData(uid) {
  try {
    const doc = await db.collection('customers').doc(uid).get();
    if (!doc.exists) {
      showToast('Account data not found. Contact support.');
      return;
    }
    customerData = doc.data();
    renderProfile(customerData);
    renderDashboard(customerData);
await loadLoads(uid);
    await loadInvoices(uid);
    await loadBilling(uid);
    await loadStatements(uid);
    await loadActivity(uid);
  } catch(err) {
    console.error('Error loading data:', err);
    showToast('Error loading your data. Please refresh.');
  }
}

// ── RENDER PROFILE ──────────────────────────────────────────
function renderProfile(data) {
  setText('profile-name-display', data.name || '');
  setText('profile-email-display', data.email || '');
  setVal('profile-company', data.company || '');
  setVal('profile-mc', data.mc || '');
  setVal('profile-dot', data.dot || '');
  setVal('profile-phone', data.phone || '');
  setVal('profile-email-input', data.email || '');
  setVal('profile-address', data.address || '');

  // Avatar initials
  const initials = (data.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  document.querySelectorAll('.avatar').forEach(el => el.textContent = initials);

  // Sidebar name
  setText('sidebar-profile-name', data.name || '');
}

// ── RENDER DASHBOARD ────────────────────────────────────────
function renderDashboard(data) {
  setText('welcome-name-first', (data.name || 'there').split(' ')[0]);
  setText('kpi-active-loads', data.activeLoads || 0);
  setText('kpi-loads-month', data.loadsThisMonth || 0);
  setText('kpi-revenue', '$' + (data.revenueDispatched || 0).toLocaleString());
  setText('kpi-drivers', data.driversManaged || 0);
   setText('ytd-revenue', '$' + (data.ytdRevenue || 0).toLocaleString());
setText('ytd-loads', data.ytdLoads || 0);
setText('ytd-avg', '$' + (data.avgRatePerLoad || 0).toLocaleString());
   setText('fleet-total', data.fleetTotal || 0);
setText('fleet-transit', data.fleetInTransit || 0);
setText('fleet-available', data.fleetAvailable || 0);
setText('fleet-down', data.fleetDown || 0);
   setText('delta-loads-text', data.deltaLoads || '—');
setText('delta-revenue-text', data.deltaRevenue || '—');
setText('delta-invoices-text', data.deltaInvoices || '—');
setText('delta-drivers-text', data.deltaDrivers || '—');

  const hour = new Date().getHours();
  const greeting = document.querySelector('.welcome-greeting');
  if (greeting) {
    if (hour < 12)      greeting.textContent = 'Good morning,';
    else if (hour < 17) greeting.textContent = 'Good afternoon,';
    else                greeting.textContent = 'Good evening,';
  }
}
// ── LOAD LOADS ──────────────────────────────────────────────
async function loadLoads(uid) {
  const snap = await db.collection('customers').doc(uid).collection('loads').get();
  const tbody = document.getElementById('loads-tbody');
  if (!tbody) return;
tbody.innerHTML = '';
  let activeLoadsCount = 0;
  let countAll = 0;
  let countTransit = 0;
  let countDelivered = 0;
  let countCancelled = 0;
snap.forEach(doc => {
    const d = doc.data();
if (d.status === 'In Transit') { activeLoadsCount++; countTransit++; }
    if (d.status === 'Delivered') countDelivered++;
    if (d.status === 'Cancelled') countCancelled++;
    countAll++;
   tbody.innerHTML += `
      <tr>
        <td class="mono">#${d.loadNumber}</td>
        <td>${d.route}</td>
        <td>${d.driver}</td>
        <td>${d.date}</td>
        <td>${d.rate}</td>
        <td><span class="tag ${statusClass(d.status)}">${d.status}</span></td>
      </tr>`;
  });
setText('badge-loads', activeLoadsCount);
  setText('pill-all', 'All (' + countAll + ')');
  setText('pill-transit', 'In Transit (' + countTransit + ')');
  setText('pill-delivered', 'Delivered (' + countDelivered + ')');
  setText('pill-cancelled', 'Cancelled (' + countCancelled + ')');
}

// ── LOAD INVOICES ────────────────────────────────────────────
async function loadInvoices(uid) {
  const snap = await db.collection('customers').doc(uid).collection('invoices').get();
  const tbody = document.getElementById('invoices-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let totalOutstanding = 0;
  let totalOverdue = 0;
  let totalPaid = 0;

  snap.forEach(doc => {
    const d = doc.data();
    const amount = parseFloat((d.amount || '0').replace(/[$,]/g, ''));
    if (d.status === 'Pending')  totalOutstanding += amount;
    if (d.status === 'Overdue')  { totalOverdue += amount; totalOutstanding += amount; }
    if (d.status === 'Paid')     totalPaid += amount;

    tbody.innerHTML += `
      <tr>
        <td class="mono">${d.invoiceNumber}</td>
        <td>${d.client}</td>
        <td>${d.amount}</td>
        <td>${d.issued}</td>
        <td>${d.due}</td>
        <td><span class="tag ${statusClass(d.status)}">${d.status}</span></td>
      </tr>`;
  });

setText('inv-outstanding', '$' + totalOutstanding.toLocaleString());
  setText('inv-overdue', '$' + totalOverdue.toLocaleString());
  setText('inv-paid', '$' + totalPaid.toLocaleString());
  setText('kpi-pending-inv', '$' + totalOutstanding.toLocaleString());
const pendingCount = snap.docs.filter(d => d.data().status === 'Pending' || d.data().status === 'Overdue').length;
  setText('badge-invoices', pendingCount);
}

// ── LOAD BILLING ─────────────────────────────────────────────
async function loadBilling(uid) {
  const doc = await db.collection('customers').doc(uid).collection('billing').doc('current').get();
  if (!doc.exists) return;
  const d = doc.data();
  setText('billing-plan-name', d.plan || '');
  setText('billing-plan-price', d.price || '');
  setText('billing-renews', 'Renews ' + (d.renews || ''));
  setText('billing-card-last4', (d.cardBrand || '') + ' ending in •••• ' + (d.cardLast4 || ''));
  setText('billing-card-expiry', 'Expires ' + (d.cardExpiry || ''));

  // Billing history
  const histSnap = await db.collection('customers').doc(uid).collection('billing').get();
  const histEl = document.getElementById('billing-history-list');
  if (!histEl) return;
  histEl.innerHTML = '';
  histSnap.forEach(hdoc => {
    if (hdoc.id === 'current') return;
    const h = hdoc.data();
    histEl.innerHTML += `
      <li>
        <span>${h.date}</span>
        <span class="mono">${h.amount}</span>
        <span class="tag ${statusClass(h.status)}">${h.status}</span>
      </li>`;
  });
}

// ── LOAD STATEMENTS ──────────────────────────────────────────
async function loadStatements(uid) {
  const snap = await db.collection('customers').doc(uid).collection('statements').get();
  const tbody = document.getElementById('statements-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    tbody.innerHTML += `
      <tr>
        <td>${d.date}</td>
        <td>${d.description}</td>
        <td class="mono">${d.loadNumber}</td>
        <td class="${d.credit !== '—' ? 'green mono' : ''}">${d.credit}</td>
        <td class="${d.debit !== '—' ? 'red mono' : ''}">${d.debit}</td>
        <td class="mono">${d.balance}</td>
      </tr>`;
  });
}

// ── LOAD ACTIVITY ─────────────────────────────────────────────
async function loadActivity(uid) {
  const snap = await db.collection('customers').doc(uid).collection('activity')
    .orderBy('order').get();
  const list = document.getElementById('activity-list');
  if (!list) return;
  list.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    list.innerHTML += `
      <li class="activity-item">
        <span class="act-dot ${d.dot}"></span>
        <div class="act-body">
          <p class="act-title">${d.title}</p>
          <p class="act-sub">${d.sub}</p>
        </div>
        <span class="act-tag ${statusClass(d.status)}">${d.status}</span>
      </li>`;
  });
}
// ── HELPERS ──────────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}
function statusClass(status) {
  const map = {
    'In Transit': 'active',
    'Delivered':  'success',
    'Cancelled':  'danger',
    'Pending':    'pending',
    'Paid':       'success',
    'Overdue':    'danger',
  };
  return map[status] || '';
}

// ── SIGN OUT ─────────────────────────────────────────────────
function signOut() {
  showToast('Signing out…');
  auth.signOut().then(() => {
    setTimeout(() => {
      window.location.href = 'https://app.haulxify.com/login.html';
    }, 1200);
  });
}

// ── TAB NAVIGATION ───────────────────────────────────────────
function switchTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById('tab-' + tabId);
  if (panel) panel.classList.add('active');
  const navItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (navItem) navItem.classList.add('active');
  const labels = {
    dashboard: 'Dashboard', loads: 'Loads & Dispatch', tools: 'Tools',
    invoices: 'Invoices', billing: 'Billing', statements: 'Account Statements',
    paperwork: 'Paperwork', help: 'Help Center', settings: 'Settings', profile: 'My Profile',
  };
  const bc = document.getElementById('page-title');
  if (bc) bc.textContent = labels[tabId] || tabId;
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    switchTab(item.dataset.tab);
  });
});

// ── SIDEBAR ──────────────────────────────────────────────────
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const hamburger = document.getElementById('hamburger');
const sidebarClose = document.getElementById('sidebar-close');

function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('show'); document.body.style.overflow = 'hidden'; }
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('show'); document.body.style.overflow = ''; }

hamburger?.addEventListener('click', openSidebar);
sidebarClose?.addEventListener('click', closeSidebar);
overlay?.addEventListener('click', closeSidebar);

// ── TOAST ────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── THEME ────────────────────────────────────────────────────
function setTheme(theme, btn) {
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.body.classList.toggle('light', theme === 'light');
  localStorage.setItem('hx-theme', theme);
}
(function() {
  if (localStorage.getItem('hx-theme') === 'light') {
    document.body.classList.add('light');
    const btn = document.querySelector('.theme-btn:last-child');
    if (btn) { document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); }
  }
})();

// ── CHARTS ───────────────────────────────────────────────────
function initCharts() {
  const isDark = !document.body.classList.contains('light');
  const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const labelColor = isDark ? 'rgba(240,244,255,0.4)'  : 'rgba(0,0,0,0.4)';
  Chart.defaults.color = labelColor;

const donutCtx = document.getElementById('fleet-donut');
  if (donutCtx && !donutCtx._chartInstance) {
    const fleetData = customerData ? [
      customerData.fleetInTransit || 0,
      customerData.fleetAvailable || 0,
      customerData.fleetDown || 0
    ] : [0, 0, 0];
    donutCtx._chartInstance = new Chart(donutCtx, {
      type: 'doughnut',
      data: { labels: ['In Transit','Available','Down'], datasets: [{ data: fleetData, backgroundColor: ['#f97316','#22c55e','#ef4444'], borderColor: isDark ? '#162033' : '#ffffff', borderWidth: 3, hoverOffset: 6 }] },
      options: { cutout: '72%', plugins: { legend: { display: false } }, animation: { animateScale: true, duration: 900 } }
    });
  }

const barCtx = document.getElementById('revenue-bar');
  if (barCtx && !barCtx._chartInstance) {
    const revenueData = (customerData && customerData.revenueChart) ? customerData.revenueChart : [0,0,0,0,0,0];
    barCtx._chartInstance = new Chart(barCtx, {
      type: 'bar',
      data: { labels: ['Nov','Dec','Jan','Feb','Mar','Apr'], datasets: [{ label: 'Revenue ($)', data: revenueData, backgroundColor: '#f97316', borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor }, ticks: { callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v) } } } }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initCharts, 200);
});

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.querySelector('.topbar-search input')?.focus();
  }
});
