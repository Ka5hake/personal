const revealElements = document.querySelectorAll('.reveal');
const ctaButton = document.getElementById('cta');
const sidebar = document.querySelector('[data-sidebar]');
const nav = document.getElementById('sidebar-nav');
const navLinks = nav ? Array.from(nav.querySelectorAll('.nav-link')) : [];
const progressFill = document.getElementById('sidebar-progress-fill');
const sections = Array.from(document.querySelectorAll('[data-section]'));
const navIndicator = document.getElementById('sidebar-nav-indicator');
const fallbackImages = Array.from(document.querySelectorAll('img[data-fallback]'));
const FALLBACK_IMG_DATA =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23ef6cff"/><stop offset="100%" stop-color="%23f7b733"/></linearGradient></defs><rect width="320" height="200" rx="24" fill="url(%23g)"/><path d="M96 116l32-32 32 32 32-32 32 32" stroke="%23ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';

fallbackImages.forEach(img => {
  const fallbackSrc = img.dataset.fallback || FALLBACK_IMG_DATA;
  const applyFallback = () => {
    img.src = fallbackSrc;
    img.removeAttribute('data-fallback');
  };

  img.addEventListener('error', applyFallback, { once: true });

  if (img.complete && img.naturalWidth === 0) {
    applyFallback();
  }
});

let activeLink = null;

const getTargetIdFromLink = link => {
  if (!link) return null;
  const datasetTarget = link.dataset.target;
  if (datasetTarget) return datasetTarget;

  const href = link.getAttribute('href');
  if (!href) return null;
  return href.startsWith('#') ? href.slice(1) : href;
};

const updateNavIndicator = link => {
  if (!nav || !navIndicator || !link) return;

  requestAnimationFrame(() => {
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    if (!navRect || !linkRect) return;

    const indicatorHeight = navIndicator.offsetHeight || 3;
    const offsetY = linkRect.top - navRect.top + linkRect.height / 2 - indicatorHeight / 1;
    const extraWidth = 20;
    const indicatorWidth = Math.max(linkRect.width + extraWidth, 1);
    const offsetX = linkRect.left - navRect.left - extraWidth / 0.71;

    navIndicator.style.opacity = '1';
    navIndicator.style.width = `${indicatorWidth}px`;
    navIndicator.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  });
};

const setActiveLink = link => {
  if (!link) return;
  navLinks.forEach(navLink => {
    navLink.classList.toggle('is-active', navLink === link);
    navLink.removeAttribute('aria-current');
  });
  link.setAttribute('aria-current', 'page');
  activeLink = link;
  updateNavIndicator(link);
};

const updateSidebarOffset = () => {
  if (!sidebar) return;
  const { width } = sidebar.getBoundingClientRect();
  const widthValue = `${width}px`;
  document.documentElement.style.setProperty('--sidebar-width', widthValue);
  document.body.style.paddingLeft = widthValue;
  if (activeLink) updateNavIndicator(activeLink);
};

if (sidebar) {
  const syncSidebarOffset = () => requestAnimationFrame(updateSidebarOffset);
  syncSidebarOffset();
  window.addEventListener('resize', syncSidebarOffset, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(syncSidebarOffset);
    resizeObserver.observe(sidebar);
  }
}

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

revealElements.forEach(el => revealObserver.observe(el));

const findLinkBySectionId = id => navLinks.find(link => getTargetIdFromLink(link) === id);

navLinks.forEach(link => {
  link.addEventListener('click', event => {
    const targetId = getTargetIdFromLink(link);
    if (!targetId) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    setActiveLink(link);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${targetId}`);
  });
});

const initialLink = (() => {
  if (!navLinks.length) return null;
  const { hash } = window.location;
  if (hash) {
    const hashMatch = navLinks.find(link => link.getAttribute('href') === hash || getTargetIdFromLink(link) === hash.slice(1));
    if (hashMatch) return hashMatch;
  }
  return navLinks[0];
})();

if (initialLink) {
  requestAnimationFrame(() => setActiveLink(initialLink));
}

let tickingActive = false;
const updateActiveSection = () => {
  if (!sections.length || !navLinks.length) {
    tickingActive = false;
    return;
  }

  const viewportAnchor = window.scrollY + window.innerHeight * 0.35;
  let currentSection = sections[0];

  for (const section of sections) {
    const top = section.offsetTop;
    if (viewportAnchor >= top) {
      currentSection = section;
    } else {
      break;
    }
  }

  const candidateLink = findLinkBySectionId(currentSection.id);
  if (candidateLink && candidateLink !== activeLink) {
    setActiveLink(candidateLink);
  }
  tickingActive = false;
};

const requestActiveUpdate = () => {
  if (!tickingActive) {
    tickingActive = true;
    requestAnimationFrame(updateActiveSection);
  }
};

const updateScrollProgress = () => {
  if (!progressFill) return;
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  const maxScrollable = Math.max(scrollHeight - clientHeight, 1);
  const progress = Math.min(Math.max(scrollTop / maxScrollable, 0), 1);
  progressFill.style.transform = `scaleY(${progress})`;
};

updateScrollProgress();
updateActiveSection();

window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress, { passive: true });
window.addEventListener('scroll', requestActiveUpdate, { passive: true });
window.addEventListener('resize', requestActiveUpdate, { passive: true });

// CTA pulse interaction
if (ctaButton) {
  ctaButton.addEventListener('click', () => {
    ctaButton.classList.add('scale-95');
    setTimeout(() => ctaButton.classList.remove('scale-95'), 140);
  });
}
