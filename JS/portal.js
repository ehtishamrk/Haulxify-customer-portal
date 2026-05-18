/* =================================================================
   HAULXIFY CUSTOMER PORTAL — portal.js
   Firebase-powered — all data loaded from Firestore
   ================================================================= */

const db   = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let customerData = null;
let userRole = null;

// ── AUTH GUARD ──────────────────────────────────────────────
auth.onAuthStateChanged(async function(user) {
  if (!user) {
    window.location.href = 'https://app.haulxify.com/login.html';
    return;
  }
  currentUser = user;
  showSkeletons();

  // Detect role — check drivers collection first, fall back to customers
  try {
    const driverDoc = await db.collection('drivers').doc(user.uid).get();
    if (driverDoc.exists) {
      userRole = 'driver';
      applyDriverUI();
      loadDriverData(user.uid);
    } else {
      userRole = 'customer';
      loadCustomerData(user.uid);
    }
  } catch(err) {
    console.error('Role detection failed:', err);
    loadCustomerData(user.uid); // safe fallback
  }
});

// ── SKELETON LOADERS ─────────────────────────────────────────
function showSkeletons() {
  // KPI values
  ['kpi-active-loads','kpi-loads-month','kpi-revenue','kpi-pending-inv','kpi-drivers'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<span class="skeleton skeleton-text-lg">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';
  });
  // Welcome name
  const name = document.getElementById('welcome-name-first');
  if (name) name.innerHTML = '<span class="skeleton skeleton-text">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';
  // Sidebar name
  const sname = document.getElementById('sidebar-profile-name');
  if (sname) sname.innerHTML = '<span class="skeleton skeleton-text">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';
  // Activity list
  const list = document.getElementById('activity-list');
  if (list) {
    list.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      list.innerHTML += `
        <li class="activity-item">
          <span class="skeleton skeleton-avatar"></span>
          <div class="act-body">
            <p><span class="skeleton skeleton-text"></span></p>
            <p><span class="skeleton skeleton-text-sm"></span></p>
          </div>
        </li>`;
    }
  }
}

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
    loadSettings(customerData);
await loadLoads(uid);
    await loadInvoices(uid);
    await loadBilling(uid);
    await loadStatements(uid);
    await loadActivity(uid);
await loadPaperwork(uid);
    initCharts();
  } catch(err) {
    console.error('Error loading data:', err);
    showToast('Error loading your data. Please refresh.');
  }
}

// ── RENDER PROFILE ──────────────────────────────────────────
function renderProfile(data) {
  setText('profile-name-display', data.name || '');
  setText('profile-email-display', data.email || '');
   setText('profile-plan-chip', data.plan || 'Pro Client');
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
   const tierEl = document.getElementById('sidebar-profile-tier');
if (tierEl) tierEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + (data.plan || 'Pro Client');
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

// ── LOAD PAPERWORK ─────────────────────────────────────────────
let allPaperworkDocs = [];

async function loadPaperwork(uid) {
  const snap = await db.collection('customers').doc(uid).collection('paperwork')
    .orderBy('date', 'desc').get();
  allPaperworkDocs = [];
  snap.forEach(doc => {
    allPaperworkDocs.push({ id: doc.id, ...doc.data() });
  });
  renderPaperwork(allPaperworkDocs);
}

function renderPaperwork(docs) {
  const list    = document.getElementById('paperwork-list');
  const results = document.getElementById('pw-results');
  if (!list) return;

  if (docs.length === 0) {
    list.innerHTML = `
      <div class="pw-empty">
        <i class="fa-solid fa-folder-open"></i>
        <p>No documents found matching your search.</p>
      </div>`;
    if (results) results.textContent = '0 documents found';
    return;
  }

  if (results) results.textContent = docs.length + ' document' + (docs.length !== 1 ? 's' : '') + ' found';

  list.innerHTML = docs.map(d => {
    const downloadUrl = convertToDownloadLink(d.url || '');
    return `
      <div class="doc-item-card">
        <div class="doc-item-left">
          <div class="doc-icon"><i class="fa-solid fa-file-pdf"></i></div>
          <div>
            <p class="doc-name">${d.name || 'Untitled'}</p>
            <div class="doc-meta">
              <span><i class="fa-solid fa-calendar"></i> ${formatDate(d.date)}</span>
              ${d.loadNumber ? `<span><i class="fa-solid fa-truck"></i> ${d.loadNumber}</span>` : ''}
              ${d.description ? `<span><i class="fa-solid fa-info-circle"></i> ${d.description}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="doc-item-right">
          <span class="doc-category-badge">${d.category || 'Other'}</span>
          <a href="${downloadUrl}" target="_blank" class="doc-download-btn">
            <i class="fa-solid fa-download"></i> Download
          </a>
        </div>
      </div>`;
  }).join('');
}

function filterPaperwork() {
  const search   = (document.getElementById('pw-search')?.value || '').toLowerCase();
  const category = document.getElementById('pw-category')?.value || '';
  const dateFrom = document.getElementById('pw-date-from')?.value || '';
  const dateTo   = document.getElementById('pw-date-to')?.value || '';

  const filtered = allPaperworkDocs.filter(d => {
    const matchSearch   = !search || (d.name||'').toLowerCase().includes(search) || (d.description||'').toLowerCase().includes(search);
    const matchCategory = !category || d.category === category;
    const matchFrom     = !dateFrom || d.date >= dateFrom;
    const matchTo       = !dateTo   || d.date <= dateTo;
    return matchSearch && matchCategory && matchFrom && matchTo;
  });

  renderPaperwork(filtered);
}

function clearPaperworkFilters() {
  document.getElementById('pw-search').value    = '';
  document.getElementById('pw-category').value  = '';
  document.getElementById('pw-date-from').value = '';
  document.getElementById('pw-date-to').value   = '';
  renderPaperwork(allPaperworkDocs);
}

function convertToDownloadLink(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return 'https://drive.google.com/uc?export=download&id=' + match[1];
  return url;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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



// ── SAVE PROFILE ─────────────────────────────────────────────
async function saveProfile() {
  if (!currentUser) return;
  const btn = document.querySelector('#tab-profile .btn-primary');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

  try {
    await db.collection('customers').doc(currentUser.uid).update({
      company: document.getElementById('profile-company').value.trim(),
      mc:      document.getElementById('profile-mc').value.trim(),
      dot:     document.getElementById('profile-dot').value.trim(),
      phone:   document.getElementById('profile-phone').value.trim(),
      address: document.getElementById('profile-address').value.trim(),
    });
    showToast('Profile saved successfully!');
  } catch(err) {
    showToast('Error saving profile. Try again.');
  }

  if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; }
}

// ── SAVE SETTINGS ─────────────────────────────────────────────
async function saveSettings() {
  if (!currentUser) return;
  const settings = {
    notifLoads:      document.getElementById('notif-loads').checked,
    notifInvoices:   document.getElementById('notif-invoices').checked,
    notifCompliance: document.getElementById('notif-compliance').checked,
    notifWeekly:     document.getElementById('notif-weekly').checked,
  };
  try {
    await db.collection('customers').doc(currentUser.uid).update({ settings });
    showToast('Settings saved!');
  } catch(err) {
    showToast('Error saving settings.');
  }
}

// ── LOAD SETTINGS ─────────────────────────────────────────────
function loadSettings(data) {
  if (!data.settings) return;
  const s = data.settings;
  setCheck('notif-loads',      s.notifLoads !== false);
  setCheck('notif-invoices',   s.notifInvoices !== false);
  setCheck('notif-compliance', s.notifCompliance !== false);
  setCheck('notif-weekly',     s.notifWeekly === true);
}

function setCheck(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = val;
}
// ── REQUEST ACTIONS ──────────────────────────────────────────
function requestNewLoad() {
  const name    = customerData ? customerData.name : 'Customer';
  const company = customerData ? customerData.company : '';
  const message = encodeURIComponent(
    'Hi Haulxify Team,\n\nI would like to request a new load dispatch.\n\n' +
    'Name: ' + name + '\nCompany: ' + company + '\n\nDetails:\n'
  );
  window.open('https://wa.me/923311419141?text=' + message, '_blank');
}

function requestNewInvoice() {
  const name    = customerData ? customerData.name : 'Customer';
  const company = customerData ? customerData.company : '';
  const message = encodeURIComponent(
    'Hi Haulxify Team,\n\nI would like to request a new invoice.\n\n' +
    'Name: ' + name + '\nCompany: ' + company + '\n\nDetails:\n'
  );
  window.open('https://wa.me/923311419141?text=' + message, '_blank');
}

function requestDocument() {
  const name    = customerData ? customerData.name : 'Customer';
  const company = customerData ? customerData.company : '';
  const message = encodeURIComponent(
    'Hi Haulxify Team,\n\nI would like to request a document upload to my portal.\n\n' +
    'Name: ' + name + '\nCompany: ' + company + '\n\nDocument details:\n'
  );
  window.open('https://wa.me/923056160430?text=' + message, '_blank');
}

// ── REVOKE ALL SESSIONS ──────────────────────────────────────
function revokeAllSessions() {
  if (!confirm('This will sign you out of all devices. Continue?')) return;
  showToast('Signing out of all devices…');
  setTimeout(function() {
    auth.signOut().then(function() {
      window.location.href = 'https://app.haulxify.com/login.html';
    });
  }, 1200);
}

// ── CHANGE PASSWORD ──────────────────────────────────────────
function changePassword() {
  if (!currentUser || !currentUser.email) return;
  firebase.auth().sendPasswordResetEmail(currentUser.email)
    .then(function() {
      showToast('Password reset email sent to ' + currentUser.email);
    })
    .catch(function() {
      showToast('Error sending reset email. Try again.');
    });
}
// ── EXPORT CSV ───────────────────────────────────────────────

function exportStatementsCSV() {
  if (!customerData) { showToast('No data to export.'); return; }

  const rows = [['Date', 'Description', 'Load #', 'Credit', 'Debit', 'Balance']];
  const tbody = document.getElementById('statements-tbody');
  if (tbody) {
    const trs = tbody.querySelectorAll('tr');
    trs.forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length >= 6) {
        rows.push([
          cells[0].textContent.trim(),
          cells[1].textContent.trim(),
          cells[2].textContent.trim(),
          cells[3].textContent.trim(),
          cells[4].textContent.trim(),
          cells[5].textContent.trim(),
        ]);
      }
    });
  }

  const csv = rows.map(r => r.map(cell => '"' + cell.replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = (customerData.company || 'Haulxify') + '_Statements.csv';
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV downloaded!');
}
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

// ── GET LAST 6 MONTHS ─────────────────────────────────────────
function getLast6Months() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(months[d.getMonth()]);
  }
  return result;
}

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
      data: { labels: getLast6Months(), datasets: [{ label: 'Revenue ($)', data: revenueData, backgroundColor: '#f97316', borderRadius: 6 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: gridColor }, ticks: { callback: v => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v) } }
        }
      }
    });
  }
}


document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.querySelector('.topbar-search input')?.focus();
  }
});
