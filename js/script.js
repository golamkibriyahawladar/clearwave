const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('.nav');
const header = document.querySelector('header');

// Toggle mobile menu
hamburger.addEventListener('click', () => {
    nav.classList.toggle('active');
});

// Close mobile menu when a link is clicked
const navLinks = document.querySelectorAll('.nav_items ul li a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
    });
});

// Sticky header background change on scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});


    /* ── 3D CAROUSEL ── */
document.addEventListener('DOMContentLoaded', () => {
    const cards = Array.from(document.querySelectorAll('.phone_card'));
    if (cards.length === 0) return;
    const totalCards = cards.length;
    let currentCenter = 2;
    let autoTimer = null;
    let isAnimating = false;

    // Zoom steps (Scaled to 0.85 of Original for exact matching proportions)
    const zoomSteps = [
      { pw: 200, g1: 222, g2: 395, gh: 560, sh: 520 },
      { pw: 240, g1: 266, g2: 474, gh: 670, sh: 620 },
      { pw: 280, g1: 310, g2: 553, gh: 780, sh: 720 },
      { pw: 300, g1: 332, g2: 593, gh: 835, sh: 770 },
      { pw: 320, g1: 354, g2: 632, gh: 890, sh: 820 },
    ];
    let zoomLevel = 2;

    // Per-position config: [translateX multiplier, rotateY, scale, opacity]
    const posConfig = {
      'center':       [  0,    0,    1,    1   ],
      'left1':        [ -1,   28,  0.82,  1   ],
      'right1':       [  1,  -28,  0.82,  1   ],
      'left2':        [ -1,   45,  0.64,  0.55],
      'right2':       [  1,  -45,  0.64,  0.55],
      'hidden-left':  [ -1,   60,  0.48,  0   ],
      'hidden-right': [  1,  -60,  0.48,  0   ],
    };
    const posGap = {
      'center': 0, 'left1': 'g1', 'right1': 'g1',
      'left2': 'g2', 'right2': 'g2',
      'hidden-left': 'gh', 'hidden-right': 'gh',
    };

    // Single function: apply width + transform + opacity to all cards atomically
    function applyCardStyles(suppressTransition) {
      const s = zoomSteps[zoomLevel];
      cards.forEach(card => {
        const pos = card.dataset.pos;
        const cfg = posConfig[pos];
        if (!cfg) return;
        const gapKey = posGap[pos];
        const tx = cfg[0] * (gapKey ? s[gapKey] : 0);
        const shell = card.querySelector('.phone_shell');

        if (suppressTransition) {
          card.style.transition = 'none';
          if (shell) shell.style.transition = 'none';
        }

        card.style.width   = s.pw + 'px';
        card.style.transform = `translateX(${tx}px) rotateY(${cfg[1]}deg) scale(${cfg[2]})`;
        card.style.opacity = cfg[3];
        if (shell) {
          shell.style.width = s.pw + 'px';
          // Update center shadow via JS too
          if (pos === 'center') {
            shell.style.boxShadow = '0 0 0 1px rgba(150,175,170,0.6), 0 40px 80px rgba(13,30,28,0.22), 0 0 48px rgba(26,122,110,0.12), inset 0 1px 0 rgba(255,255,255,0.6)';
          } else {
            shell.style.boxShadow = '';
          }
        }

        if (suppressTransition) {
          // Re-enable transitions next frame
          requestAnimationFrame(() => {
            card.style.transition = '';
            if (shell) shell.style.transition = '';
          });
        }
      });
      carouselStageEl.style.height = s.sh + 'px';
    }

    function getPositionForOffset(cardIndex, centerIndex, total) {
      let offset = cardIndex - centerIndex;
      while (offset > Math.floor(total / 2)) offset -= total;
      while (offset < -Math.floor(total / 2)) offset += total;
      const posMap = { '-2': 'left2', '-1': 'left1', '0': 'center', '1': 'right1', '2': 'right2' };
      return posMap[String(offset)] || (offset < 0 ? 'hidden-left' : 'hidden-right');
    }

    function updatePositions() {
      cards.forEach((card, i) => {
        card.dataset.pos = getPositionForOffset(i, currentCenter, totalCards);
      });
      document.querySelectorAll('.carousel_dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentCenter);
      });
      applyCardStyles(false); // allow transitions for sliding
    }

    function goTo(index) {
      if (isAnimating) return;
      isAnimating = true;
      currentCenter = ((index % totalCards) + totalCards) % totalCards;
      updatePositions();
      setTimeout(() => { isAnimating = false; }, 700);
    }

    function next() { goTo((currentCenter + 1) % totalCards); }
    function prev() { goTo((currentCenter - 1 + totalCards) % totalCards); }

    // Build dots
    const dotsContainer = document.getElementById('carouselDots');
    cards.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'carousel_dot' + (i === currentCenter ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });

    document.getElementById('carouselNext').addEventListener('click', () => { next(); resetAuto(); });
    document.getElementById('carouselPrev').addEventListener('click', () => { prev(); resetAuto(); });

    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        if (card.dataset.pos !== 'center') { goTo(i); resetAuto(); }
      });
    });

    function startAuto() { autoTimer = setInterval(next, 2500); }
    function stopAuto()  { clearInterval(autoTimer); }
    function resetAuto() { stopAuto(); startAuto(); }

    const stage = document.getElementById('carouselStage');
    stage.addEventListener('mouseenter', stopAuto);
    stage.addEventListener('mouseleave', startAuto);

    let touchStartX = 0;
    stage.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); resetAuto(); }
    });

    /* ── CAROUSEL ZOOM ── */
    const zoomPipsEl      = document.getElementById('zoomPips');
    const zoomInBtn       = document.getElementById('zoomIn');
    const zoomOutBtn      = document.getElementById('zoomOut');
    const carouselStageEl = document.getElementById('carouselStage');

    zoomSteps.forEach((_, i) => {
      const pip = document.createElement('div');
      pip.className = 'zoom_pip' + (i === zoomLevel ? ' active' : '');
      pip.addEventListener('click', () => setZoom(i));
      zoomPipsEl.appendChild(pip);
    });

    function setZoom(level) {
      zoomLevel = Math.max(0, Math.min(zoomSteps.length - 1, level));
      applyCardStyles(true); // suppress transition so width snaps, then transform animates
      zoomPipsEl.querySelectorAll('.zoom_pip').forEach((p, i) => {
        p.classList.toggle('active', i === zoomLevel);
      });
      zoomOutBtn.disabled = zoomLevel === 0;
      zoomInBtn.disabled  = zoomLevel === zoomSteps.length - 1;
    }

    zoomInBtn.addEventListener('click',  () => setZoom(zoomLevel + 1));
    zoomOutBtn.addEventListener('click', () => setZoom(zoomLevel - 1));

    // Init
    updatePositions();
    setZoom(zoomLevel);
    startAuto();

    /* ── STAT COUNTERS ── */
    function animateCounter(el) {
      const target = parseFloat(el.dataset.target);
      const decimal = el.dataset.decimal;
      const duration = 1800;
      const start = performance.now();
      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const val = eased * target;
        el.textContent = decimal ? val.toFixed(1) : Math.floor(val);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = decimal ? target.toFixed(1) : target;
      }
      requestAnimationFrame(step);
    }
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.stat_num').forEach(animateCounter);
          statObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('.stats_grid').forEach(el => statObserver.observe(el));


    /* ── PRICING TOGGLE ── */
    const prices = { starter: [20, 13], pro: [60, 39], ent: [150, 98] };
    const annualTotals = { starter: 156, pro: 468, ent: 1176 };
    let isAnnual = false;
    const pricingToggle = document.getElementById('pricingToggle');
    const monthlyLabel = document.getElementById('monthlyLabel');
    const annualLabel = document.getElementById('annualLabel');

    function updatePricing() {
      const idx = isAnnual ? 1 : 0;
      document.getElementById('price_starter').textContent = prices.starter[idx];
      document.getElementById('price_pro').textContent = prices.pro[idx];
      document.getElementById('price_ent').textContent = prices.ent[idx];
      document.getElementById('annual_note_starter').textContent = isAnnual ? `${annualTotals.starter} billed annually` : '\u00a0';
      document.getElementById('annual_note_pro').textContent     = isAnnual ? `${annualTotals.pro} billed annually` : '\u00a0';
      document.getElementById('annual_note_ent').textContent     = isAnnual ? `${annualTotals.ent} billed annually` : '\u00a0';
      monthlyLabel.classList.toggle('active', !isAnnual);
      annualLabel.classList.toggle('active', isAnnual);
      pricingToggle.classList.toggle('annual', isAnnual);
      pricingToggle.setAttribute('aria-checked', isAnnual);
    }

    pricingToggle.addEventListener('click', () => { isAnnual = !isAnnual; updatePricing(); });
});


// FAQ Toggle Logic
const faqQuestions = document.querySelectorAll('.faq_question');
const faqToggleAllBtn = document.getElementById('faqToggleAll');
const faqToggleIcon = document.getElementById('faqToggleIcon');
let allExpanded = false;

if (faqQuestions.length > 0) {
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            const isOpen = item.classList.contains('open');
            
            // Close all others
            document.querySelectorAll('.faq_item').forEach(otherItem => {
                otherItem.classList.remove('open');
                otherItem.querySelector('.faq_question').setAttribute('aria-expanded', 'false');
            });
            
            // Toggle current
            if (!isOpen) {
                item.classList.add('open');
                question.setAttribute('aria-expanded', 'true');
            }
            
            checkAllExpandedStatus();
        });
    });
}

if (faqToggleAllBtn) {
    faqToggleAllBtn.addEventListener('click', () => {
        const allItems = document.querySelectorAll('.faq_item');
        allExpanded = !allExpanded;
        
        allItems.forEach(item => {
            if (allExpanded) {
                item.classList.add('open');
                item.querySelector('.faq_question').setAttribute('aria-expanded', 'true');
            } else {
                item.classList.remove('open');
                item.querySelector('.faq_question').setAttribute('aria-expanded', 'false');
            }
        });
        
        faqToggleIcon.textContent = allExpanded ? '-' : '+';
        faqToggleAllBtn.innerHTML = `<span id="faqToggleIcon">${allExpanded ? '-' : '+'}</span> ${allExpanded ? 'Collapse all' : 'Expand all'}`;
    });
}

function checkAllExpandedStatus() {
    const allItems = document.querySelectorAll('.faq_item');
    const openItems = document.querySelectorAll('.faq_item.open');
    
    if (openItems.length === allItems.length) {
        allExpanded = true;
        if(faqToggleAllBtn) faqToggleAllBtn.innerHTML = `<span id="faqToggleIcon">-</span> Collapse all`;
    } else if (openItems.length === 0) {
        allExpanded = false;
        if(faqToggleAllBtn) faqToggleAllBtn.innerHTML = `<span id="faqToggleIcon">+</span> Expand all`;
    }
}


