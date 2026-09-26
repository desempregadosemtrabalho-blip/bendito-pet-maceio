'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

window.trackEvent = function trackEvent(nome) {
  window.dispatchEvent(new CustomEvent('benditopet:track', { detail: { nome } }));
};

document.querySelectorAll('[data-track]').forEach((link) => {
  link.addEventListener('click', () => window.trackEvent(link.dataset.track), { passive: true });
});

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.nav-links');

function setMenu(open) {
  menuButton?.setAttribute('aria-expanded', String(open));
  menu?.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
}

menuButton?.addEventListener('click', () => {
  setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
});

menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});

const revealItems = document.querySelectorAll('.reveal');
if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
}

function animateNumber(element, endValue, decimal) {
  if (prefersReducedMotion.matches) {
    element.textContent = decimal ? `${endValue.toFixed(1)}`.replace('.', ',') : String(endValue);
    return;
  }

  const start = performance.now();
  const duration = 1000;
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = endValue * eased;
    element.textContent = decimal ? value.toFixed(1).replace('.', ',') : String(Math.round(value));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const numberTargets = [...document.querySelectorAll('[data-count], [data-count-decimal]')];
if ('IntersectionObserver' in window) {
  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const decimal = entry.target.hasAttribute('data-count-decimal');
      const end = Number(decimal ? entry.target.dataset.countDecimal : entry.target.dataset.count);
      animateNumber(entry.target, end, decimal);
      observer.unobserve(entry.target);
    });
  }, { threshold: .5 });
  numberTargets.forEach((item) => countObserver.observe(item));
} else {
  numberTargets.forEach((item) => animateNumber(item, Number(item.dataset.countDecimal ?? item.dataset.count), item.hasAttribute('data-count-decimal')));
}

const careSection = document.querySelector('[data-care]');
const stampSlots = [...document.querySelectorAll('.stamp-slot')];
const careSteps = [...document.querySelectorAll('.care-step')];
const careStage = document.querySelector('.care-stage');
const careStatus = document.querySelector('.care-status strong');
let careFrame = 0;
let lastStampCount = -1;

function applyCareState(stampCount, activeStep) {
  const normalized = stampCount / 4;
  careStage?.style.setProperty('--care-progress', `${normalized * 100}%`);

  if (stampCount !== lastStampCount) {
    stampSlots.forEach((slot, index) => slot.classList.toggle('is-stamped', index < stampCount));
    careSteps.forEach((step, index) => step.classList.toggle('is-active', index === activeStep));
    if (careStatus) careStatus.textContent = String(activeStep + 1);
    lastStampCount = stampCount;
  }
}

function updateCareProgress() {
  careFrame = 0;
  if (!careSection || prefersReducedMotion.matches) {
    applyCareState(4, 3);
    return;
  }
  const sectionRect = careSection.getBoundingClientRect();
  if (sectionRect.top >= window.innerHeight) {
    applyCareState(0, 0);
    return;
  }
  if (sectionRect.bottom <= 0) {
    applyCareState(4, 3);
    return;
  }

  const anchor = window.innerHeight * (window.innerWidth < 768 ? .72 : .55);
  const firstStepRect = careSteps[0].getBoundingClientRect();
  if (firstStepRect.top > window.innerHeight * .9) {
    applyCareState(0, 0);
    return;
  }

  let activeStep = careSteps.findIndex((step) => step.getBoundingClientRect().bottom > anchor);
  if (activeStep === -1) activeStep = careSteps.length - 1;
  applyCareState(activeStep + 1, activeStep);
}

function requestCareUpdate() {
  if (!careFrame) careFrame = requestAnimationFrame(updateCareProgress);
}

window.addEventListener('scroll', requestCareUpdate, { passive: true });
window.addEventListener('resize', requestCareUpdate, { passive: true });
prefersReducedMotion.addEventListener?.('change', requestCareUpdate);
updateCareProgress();
