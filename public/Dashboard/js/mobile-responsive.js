/* ═══════════════════════════════════════════════════════════════
   mobile-responsive.js
   Responsive UI interactions untuk mobile & tablet
   - Sidebar toggle/drawer
   - Touch optimizations
   - Responsive modal handling
   ═══════════════════════════════════════════════════════════════ */

// ─── SIDEBAR MOBILE TOGGLE ─────────────────────────────────────
function initMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebarGhost = document.getElementById('sidebar-ghost');
  const body = document.body;

  if (!sidebar || !sidebarToggle) return;

  // Check if we're on mobile
  const isMobile = window.innerWidth <= 768;
  if (!isMobile) return;

  // Toggle button click
  sidebarToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileSidebar();
  });

  // Ghost zone — hanya untuk close, tidak ada hover/mouseenter
  if (sidebarGhost) {
    sidebarGhost.addEventListener('click', () => {
      closeMobileSidebar();
    });
    // Pastikan tidak ada mouseenter yang bisa membuka sidebar
    sidebarGhost.onmouseenter = null;
  }

  // Close when clicking nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      closeMobileSidebar();
    });
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.innerWidth <= 768) {
      closeMobileSidebar();
    }
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      // Desktop mode - ensure sidebar is visible
      sidebar.classList.remove('collapsed');
      body.classList.remove('sidebar-open');
    }
  });
}

function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const body = document.body;

  sidebar.classList.toggle('collapsed');
  body.classList.toggle('sidebar-open');
}

function closeMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const body = document.body;

  sidebar.classList.add('collapsed');
  body.classList.remove('sidebar-open');
}

function openMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const body = document.body;

  sidebar.classList.remove('collapsed');
  body.classList.add('sidebar-open');
}

window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
window.openMobileSidebar = openMobileSidebar;

// ─── RESPONSIVE MODAL HANDLER ─────────────────────────────────
function initResponsiveModals() {
  const modals = document.querySelectorAll('.modal');

  modals.forEach(modal => {
    const closeBtn = modal.querySelector('.modal-close-btn');

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
      });
    }

    // Click outside to close (only on mobile)
    if (window.innerWidth <= 768) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
          document.body.style.overflow = 'auto';
        }
      });
    }
  });
}

// ─── RESPONSIVE DRAWER HANDLER ────────────────────────────────
function initResponsiveDrawers() {
  const drawers = document.querySelectorAll('.drawer');

  drawers.forEach(drawer => {
    const closeBtn = drawer.querySelector('.drawer-close-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        drawer.style.display = 'none';
        document.body.style.overflow = 'auto';
      });
    }

    // Swipe to close on mobile
    let touchStartX = 0;
    drawer.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    });

    drawer.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      // Swipe right to close (drawer from right)
      if (touchEndX - touchStartX > 100) {
        drawer.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });
  });
}

// ─── PREVENT DOUBLE TAP ZOOM ───────────────────────────────────
function initDoubleClickZoomFix() {
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    false
  );
}

// ─── FIX VIEWPORT HEIGHT ON MOBILE ────────────────────────────
function fixViewportHeight() {
  if (window.innerWidth <= 768) {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    window.addEventListener('resize', () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
  }
}

// ─── DETECT TOUCH DEVICE ───────────────────────────────────────
function isTouchDevice() {
  return (
    !!(
      navigator.maxTouchPoints ||
      navigator.msMaxTouchPoints ||
      window.ontouchstart !== undefined
    ) || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

// ─── OPTIMIZE FOR TOUCH ────────────────────────────────────────
function optimizeTouchElements() {
  if (!isTouchDevice()) return;

  // Add active state to buttons
  document.addEventListener('touchstart', function () {}, true);

  // Make interactive elements easier to tap
  document.querySelectorAll('button, a, .nav-item, .de-btn').forEach(el => {
    if (getComputedStyle(el).minHeight < '44px') {
      el.style.minHeight = '44px';
    }
  });
}

// ─── INIT ALL MOBILE FEATURES ──────────────────────────────────
function initMobileResponsive() {
  if (window.innerWidth <= 768) {
    initMobileSidebar();
    initResponsiveModals();
    initResponsiveDrawers();
    initDoubleClickZoomFix();
    fixViewportHeight();
    optimizeTouchElements();

    console.log('📱 Mobile responsive initialized');
  }
}

// ─── AUTO INIT ON LOAD ─────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileResponsive);
} else {
  initMobileResponsive();
}

// Re-init on resize for breakpoint changes
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const isMobile = window.innerWidth <= 768;
    const wasInitialized = document.body.classList.contains('mobile-init');

    if (isMobile && !wasInitialized) {
      document.body.classList.add('mobile-init');
      initMobileResponsive();
    } else if (!isMobile && wasInitialized) {
      document.body.classList.remove('mobile-init');
      // Reset to desktop state
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) sidebar.classList.remove('collapsed');
    }
  }, 250);
});