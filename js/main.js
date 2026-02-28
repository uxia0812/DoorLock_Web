/* ============================================
   CONFIG — 실제 값으로 교체하세요
   ============================================ */
const CONFIG = {
  // 검색할 사업자명 (네이버 지역검색 쿼리)
  // 사진에서 보이는 '강성24시출장열쇠번호키디지털도어락' 같은 정확한 상호명
  brandName: '강성24시출장열쇠번호키디지털도어락',

  // 표시할 매장 수
  displayCount: 5,

  // 대표 전화 (헤더/히어로 CTA)
  mainPhone: '010-0000-0000',
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
   네이버 지역검색 API → 매장 카드 동적 렌더링
   ============================================ */
async function loadStores() {
  const grid    = document.getElementById('storesGrid');
  const loading = document.getElementById('storesLoading');
  if (!grid) return;

  // 리뷰 데이터 불러오기
  let reviewsData = { stores: [] };
  try {
    const r = await fetch('/data/reviews.json');
    if (r.ok) reviewsData = await r.json();
  } catch (_) {}

  // 로딩 표시
  if (loading) loading.style.display = 'flex';
  grid.style.display = 'none';

  try {
    // Vercel Serverless Function 호출
    const res = await fetch(
      `/api/naver-search?query=${encodeURIComponent(CONFIG.brandName)}&display=${CONFIG.displayCount}`
    );

    if (!res.ok) throw new Error('API 응답 오류');
    const data = await res.json();

    if (!data.items || data.items.length === 0) throw new Error('검색 결과 없음');

    renderStoreCards(grid, data.items, reviewsData);

  } catch (err) {
    console.warn('[stores] API 실패, 폴백 데이터 사용:', err.message);
    // API 실패 시 reviews.json의 fallback 데이터로 렌더링
    renderFallbackCards(grid, reviewsData);
  } finally {
    if (loading) loading.style.display = 'none';
    grid.style.display = '';
    initStoreCardAnimation(grid);
  }
}

/* 네이버 API 응답 → 카드 렌더링 */
function renderStoreCards(grid, items, reviewsData) {
  grid.innerHTML = items.map((item, idx) => {
    const storeReviews = reviewsData.stores[idx] || reviewsData.stores[0] || null;
    const phone = item.telephone || CONFIG.mainPhone;
    const naverUrl = storeReviews?.naverMapUrl || item.naverMapUrl;
    const reviewCount = storeReviews?.reviews?.length || 0;
    const ratingDisplay = storeReviews?.rating || '4.9';

    return `
      <div class="store-card" data-aos>
        <div class="store-card__header">
          <div>
            <h3 class="store-card__name">${escapeHtml(item.title)}</h3>
            <div class="store-card__rating">
              <span class="stars">★★★★★</span>
              <span class="rating-num">${ratingDisplay}</span>
              ${reviewCount ? `<span class="review-count">(리뷰 ${reviewCount}개)</span>` : ''}
            </div>
          </div>
          <span class="badge badge--open">영업중</span>
        </div>
        <div class="store-card__info">
          <div class="info-row">
            <span class="info-icon">📍</span>
            <span>${escapeHtml(item.address)}</span>
          </div>
          ${phone ? `
          <div class="info-row">
            <span class="info-icon">📞</span>
            <a href="tel:${phone.replace(/[^0-9]/g,'')}">${phone}</a>
          </div>` : ''}
          <div class="info-row">
            <span class="info-icon">🕐</span>
            <span>24시간 연중무휴</span>
          </div>
        </div>
        <div class="store-card__actions">
          ${phone ? `<a href="tel:${phone.replace(/[^0-9]/g,'')}" class="btn btn--primary btn--sm">전화 연결</a>` : ''}
          <a href="${escapeHtml(naverUrl)}" target="_blank" rel="noopener" class="btn btn--naver btn--sm">네이버 지도</a>
        </div>
      </div>
    `;
  }).join('');
}

/* API 실패 시 reviews.json 기반 폴백 */
function renderFallbackCards(grid, reviewsData) {
  if (!reviewsData.stores || reviewsData.stores.length === 0) {
    grid.innerHTML = '<p class="stores__error">매장 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.</p>';
    return;
  }

  grid.innerHTML = reviewsData.stores.map((store) => {
    const reviewCount = store.reviews?.length || 0;
    return `
      <div class="store-card" data-aos>
        <div class="store-card__header">
          <div>
            <h3 class="store-card__name">${escapeHtml(store.searchQuery.split(' ')[0])}</h3>
            <div class="store-card__rating">
              <span class="stars">★★★★★</span>
              <span class="rating-num">4.9</span>
              ${reviewCount ? `<span class="review-count">(리뷰 ${reviewCount}개)</span>` : ''}
            </div>
          </div>
          <span class="badge badge--open">영업중</span>
        </div>
        <div class="store-card__info">
          <div class="info-row">
            <span class="info-icon">📞</span>
            <a href="tel:${CONFIG.mainPhone.replace(/[^0-9]/g,'')}">${CONFIG.mainPhone}</a>
          </div>
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
    `;
  }).join('');
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
