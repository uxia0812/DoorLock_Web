/* ============================================
   CONFIG — 실제 값으로 교체하세요
   ============================================ */
const CONFIG = {
  // 대표 전화 (헤더/히어로 CTA)
  mainPhone: '010-4727-7077',
};

/* ============================================
   HEADER: 스크롤 시 그림자
   ============================================ */
(function () {
  const header = document.getElementById('header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 10
      ? '0 4px 20px rgba(10,36,99,.18)'
      : '0 2px 8px rgba(10,36,99,.08)';
  }, { passive: true });
})();

/* ============================================
   FLOATING CTA: 히어로 지나면 표시
   ============================================ */
(function () {
  const cta  = document.getElementById('floatingCta');
  const hero = document.querySelector('.hero');
  if (!cta || !hero) return;

  cta.style.cssText = 'transition:transform .3s ease,opacity .3s ease; transform:translateY(100%); opacity:0;';

  new IntersectionObserver(([e]) => {
    cta.style.transform = e.isIntersecting ? 'translateY(100%)' : 'translateY(0)';
    cta.style.opacity   = e.isIntersecting ? '0' : '1';
  }, { threshold: 0.1 }).observe(hero);
})();

/* ============================================
   SCROLL REVEAL
   ============================================ */
(function () {
  if (!('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll('.service-card, .trust-item, .hero__stats');
  targets.forEach((el, i) => {
    el.style.cssText = `opacity:0;transform:translateY(24px);transition:opacity .5s ease ${(i%3)*.1}s,transform .5s ease ${(i%3)*.1}s`;
  });
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach((el) => obs.observe(el));
})();

/* ============================================
   매장 카드 동적 렌더링 (stores.json 기반)
   ============================================ */
async function loadStores() {
  const grid    = document.getElementById('storesGrid');
  const loading = document.getElementById('storesLoading');
  if (!grid) return;

  if (loading) loading.style.display = 'flex';
  grid.style.display = 'none';

  try {
    const res = await fetch('/data/stores.json');
    if (!res.ok) throw new Error('매장 데이터 로드 실패');
    const data = await res.json();

    if (!data.stores || data.stores.length === 0) throw new Error('매장 정보 없음');

    renderStoreCards(grid, data.stores);

  } catch (err) {
    console.warn('[stores] 로드 실패:', err.message);
    grid.innerHTML = '<p class="stores__error">매장 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.</p>';
  } finally {
    if (loading) loading.style.display = 'none';
    grid.style.display = '';
    initStoreCardAnimation(grid);
  }
}

/* 매장 카드 렌더링 (전화번호 표시 제거, 전화 연결 버튼만) */
function renderStoreCards(grid, stores) {
  grid.innerHTML = stores.map((store) => `
    <div class="store-card" data-aos>
      <div class="store-card__header">
        <div>
          <h3 class="store-card__name">${escapeHtml(store.location)}</h3>
          <div class="store-card__rating">
            <span class="stars">★★★★★</span>
            <span class="rating-num">5</span>
          </div>
        </div>
        <span class="badge badge--open">영업중</span>
      </div>
      <div class="store-card__info">
        <div class="info-row">
          <span class="info-icon">🕐</span>
          <span>24시간 연중무휴</span>
        </div>
      </div>
      <div class="store-card__actions">
        <a href="tel:${CONFIG.mainPhone.replace(/[^0-9]/g,'')}" class="btn btn--primary btn--sm">전화 연결</a>
        <a href="${escapeHtml(store.naverMapUrl)}" target="_blank" rel="noopener" class="btn btn--naver btn--sm">네이버 지도</a>
      </div>
    </div>
  `).join('');
}

/* ============================================
   reviews.json → 리뷰 카드 동적 렌더링
   ============================================ */
async function loadReviews() {
  const grid = document.getElementById('reviewGrid');
  if (!grid) return;

  try {
    const res = await fetch('/data/reviews.json');
    if (!res.ok) return;
    const data = await res.json();

    // 모든 매장의 리뷰를 합쳐서 최신순 정렬
    const allReviews = data.stores.flatMap((store, si) =>
      (store.reviews || []).map((r) => ({ ...r, storeIndex: si }))
    );

    if (allReviews.length === 0) return;

    grid.innerHTML = allReviews.map((review) => `
      <div class="review-card" data-aos>
        <div class="review-card__top">
          <div class="reviewer">
            <div class="reviewer__avatar">${review.author.charAt(0)}</div>
            <div>
              <div class="reviewer__name">${escapeHtml(review.author)}</div>
              <div class="reviewer__stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
            </div>
          </div>
          <span class="review-card__source naver">N</span>
        </div>
        <p class="review-card__text">"${escapeHtml(review.text)}"</p>
        <div class="review-card__date">${escapeHtml(review.date)}</div>
      </div>
    `).join('');

    initStoreCardAnimation(grid);

  } catch (err) {
    console.warn('[reviews] 로드 실패:', err.message);
  }
}

/* ============================================
   카드 애니메이션 초기화
   ============================================ */
function initStoreCardAnimation(container) {
  if (!('IntersectionObserver' in window)) return;
  const cards = container.querySelectorAll('[data-aos]');
  cards.forEach((el, i) => {
    el.style.cssText = `opacity:0;transform:translateY(24px);transition:opacity .5s ease ${(i%3)*.1}s,transform .5s ease ${(i%3)*.1}s`;
  });
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  cards.forEach((el) => obs.observe(el));
}

/* ============================================
   XSS 방지 유틸
   ============================================ */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ============================================
   전화 클릭 이벤트 (GA 연동 준비)
   ============================================ */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="tel:"]');
  if (!link) return;
  // gtag('event', 'phone_call_click', { phone: link.href });
  console.log('[CTA] 전화 연결:', link.href);
});

/* ============================================
   INIT
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadStores();
  loadReviews();
});
