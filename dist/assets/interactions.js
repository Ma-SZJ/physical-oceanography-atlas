(() => {
  // ---- Lightbox (zoom images) ----
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = '<img alt="" loading="lazy"><button class="lightbox-close" aria-label="关闭">&times;</button>';
  document.body.appendChild(overlay);

  const lbImg = overlay.querySelector('img');
  const lbClose = overlay.querySelector('.lightbox-close');

  function openLightbox(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }
  function closeLightbox() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.body.addEventListener('click', e => {
    const img = e.target.closest('.data-figure img, .zoomable img');
    if (img) {
      e.preventDefault();
      openLightbox(img.src, img.alt);
      return;
    }
    if (e.target === overlay || e.target.closest('.lightbox-close')) {
      closeLightbox();
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

  // ---- Scrollspy ----
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sectionIds = [...navLinks].map(a => a.getAttribute('href').replace('#', ''));
  let activeLink = null;
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (!visible.length) return;
    const id = visible[0].target.id;
    const link = [...navLinks].find(a => a.getAttribute('href') === '#' + id);
    if (link && link !== activeLink) {
      if (activeLink) activeLink.classList.remove('active');
      link.classList.add('active');
      activeLink = link;
    }
  }, { rootMargin: '-56px 0px -60% 0px', threshold: 0 });
  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  // ---- Back to top ----
  const topBtn = document.createElement('button');
  topBtn.id = 'back-to-top';
  topBtn.setAttribute('aria-label', '回到顶部');
  topBtn.textContent = '↑';
  document.body.appendChild(topBtn);
  topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      topBtn.classList.toggle('show', window.scrollY > 500);
      ticking = false;
    });
  }, { passive: true });
})();
