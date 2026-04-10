/* ─────────────────────────────────────────────────────────────
   HAULXIFY — nav.js
   Include this as a standalone <script src="/js/nav.js"> on
   every page that uses nav.html. This is separate from nav.html
   because scripts inside innerHTML-injected HTML do NOT execute
   in modern browsers — which is why the modal was not opening.
   ───────────────────────────────────────────────────────────── */

function openSignIn(e) {
  if (e) e.preventDefault();
  const overlay = document.getElementById('signin-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const emailField = document.getElementById('signin-email');
    if (emailField) emailField.focus();
  }, 150);
}

function closeSignIn() {
  const overlay = document.getElementById('signin-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  document.body.style.overflow = '';

  const errorBox = document.getElementById('signin-error');
  if (errorBox) errorBox.style.display = 'none';

  const emailField = document.getElementById('signin-email');
  if (emailField) emailField.value = '';

  const pwField = document.getElementById('signin-password');
  if (pwField) pwField.value = '';

  const btn = document.getElementById('signin-btn');
  if (btn) {
    btn.textContent = 'Sign In to Customer Portal';
    btn.style.background = 'var(--brand-navy)';
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }
}

function togglePassword() {
  const pw = document.getElementById('signin-password');
  if (!pw) return;
  pw.type = pw.type === 'password' ? 'text' : 'password';
}

function handleSignIn() {
  const email    = document.getElementById('signin-email')?.value.trim();
  const password = document.getElementById('signin-password')?.value;
  const btn      = document.getElementById('signin-btn');
  const errorBox = document.getElementById('signin-error');
  const errorMsg = document.getElementById('signin-error-msg');

  if (!email) {
    if (errorMsg) errorMsg.textContent = 'Please enter your email address.';
    if (errorBox) errorBox.style.display = 'flex';
    document.getElementById('signin-email')?.focus();
    return;
  }
  if (!password) {
    if (errorMsg) errorMsg.textContent = 'Please enter your password.';
    if (errorBox) errorBox.style.display = 'flex';
    document.getElementById('signin-password')?.focus();
    return;
  }

  if (btn) { btn.textContent = 'Signing in…'; btn.style.opacity = '0.7'; btn.style.cursor = 'not-allowed'; }
  if (errorBox) errorBox.style.display = 'none';

  // ── DUMMY AUTH ── replace with real API in production
  setTimeout(() => {
    const validEmail = email.toLowerCase() === 'demo@haulxify.com';
    const validPass  = password === 'demo1234';

    if (validEmail && validPass) {
      if (btn) { btn.textContent = '✓ Redirecting to portal…'; btn.style.background = '#16a34a'; btn.style.opacity = '1'; }
      setTimeout(() => {
        window.open('https://app.haulxify.com', '_blank');
        closeSignIn();
      }, 900);
    } else {
      if (btn) { btn.textContent = 'Sign In to Customer Portal'; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
      if (errorMsg) errorMsg.textContent = 'Incorrect email or password. Please try again.';
      if (errorBox) errorBox.style.display = 'flex';
      const pwField = document.getElementById('signin-password');
      if (pwField) { pwField.value = ''; pwField.focus(); }
    }
  }, 900);
}

// Close on Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeSignIn();
});

// ── NAV HELPER: re-execute scripts after innerHTML include ──
// Call this if you're injecting nav.html via fetch + innerHTML.
// It re-runs any <script> tags found inside the injected HTML.
function reinitScripts(container) {
  container.querySelectorAll('script').forEach(oldScript => {
    const newScript = document.createElement('script');
    [...oldScript.attributes].forEach(attr => newScript.setAttribute(attr.name, attr.value));
    newScript.textContent = oldScript.textContent;
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

// ── HAMBURGER (mobile nav) ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
});
