import { PRODUCTS, getProduct, formatMoney, productLabel } from './data.js';

const CART_KEY = 'ecru_cart_v1';
const WISH_KEY = 'ecru_wishlist_v1';
const NEWSLETTER_KEY = 'ecru_newsletter_v1';
const FREE_SHIPPING = 150;

const ICONS = {
  bag: '<path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  heart: '<path d="M12 20s-7-4.35-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.65 12 20 12 20Z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  arrowRight: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  arrowUpRight: '<path d="M6 18 18 6M8 6h10v10"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  star: '<path d="m12 2.6 2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.44 6.2 20.5l1.1-6.47L2.6 9.45l6.5-.95L12 2.6Z"/>',
  truck: '<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  leaf: '<path d="M20 4C10 4 4 8 4 15c0 2 .6 3.5 1.5 4.5C8 16 11 13.5 15 12c-3 2.5-5.5 5-6.5 8"/>',
  refresh: '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.4-2L20 9M4 15l2.5 2A7 7 0 0 0 18 15"/>',
  zoom: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5M11 8v6M8 11h6"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".8" fill="currentColor" stroke="none"/>',
  pinterest: '<path d="M9 21c.5-2 1.5-5.5 1.5-5.5S10 14.5 10 13c0-2 1.2-3.5 2.7-3.5 1.3 0 1.9 1 1.9 2.1 0 1.3-.8 3.2-1.3 5-.4 1.5.8 2.8 2.3 2.8 2.8 0 4.6-3.5 4.6-7.6 0-3.2-2.1-5.5-5.9-5.5-4.3 0-7 3.2-7 6.7 0 1.2.4 2.5 1 3.2.1.1.1.2.1.4-.1.3-.2.9-.2 1-.1.3-.3.4-.6.2-1.7-.8-2.5-3-2.5-5.4C5 8.3 8.5 4 14.2 4 18.8 4 22 7.3 22 11.7c0 5.1-2.8 8.9-6.9 8.9-1.4 0-2.7-.8-3.1-1.7l-.8 3.1"/>',
  tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3-3.46"/><path d="M14 4c.4 2.2 2 3.8 4.5 4"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>'
};

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return null;
    }
    return value;
  }
};

export function icon(name, className = '') {
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

export const money = formatMoney;

export function starRating() {
  return `<span class="stars" aria-hidden="true">${Array.from({ length: 5 }, () => icon('star')).join('')}</span>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function cartItemKey(item) {
  return `${item.id}|${item.size}|${item.color}`;
}

export function getCart() {
  const items = store.get(CART_KEY, []);
  if (!Array.isArray(items)) return [];
  return items.filter(item => item && getProduct(item.id));
}

function saveCart(items) {
  store.set(CART_KEY, items);
  updateCounts();
  renderCart();
}

export function getWishlist() {
  const items = store.get(WISH_KEY, []);
  if (!Array.isArray(items)) return [];
  return items.filter(id => getProduct(id));
}

export function isSaved(id) {
  return getWishlist().includes(id);
}

export function getTotals(items = getCart()) {
  const subtotal = items.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : 12;
  return { subtotal, shipping, total: subtotal + shipping };
}

export function updateCounts() {
  const cartCount = getCart().reduce((sum, item) => sum + item.qty, 0);
  const wishCount = getWishlist().length;
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    el.textContent = String(cartCount);
    el.classList.toggle('has-items', cartCount > 0);
  });
  document.querySelectorAll('[data-wishlist-count]').forEach(el => {
    el.textContent = String(wishCount);
    el.classList.toggle('has-items', wishCount > 0);
  });
  const label = document.querySelector('#cart-count-label');
  if (label) label.textContent = `(${cartCount})`;
}

export function showToast(message, options = {}) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `${icon('check')}<span>${escapeHtml(message)}</span>${
    options.href ? `<a href="${options.href}">${escapeHtml(options.action || 'View')}</a>` : ''
  }`;
  stack.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add('is-leaving');
    window.setTimeout(() => toast.remove(), 320);
  }, options.duration || 3400);
}

export function toggleWishlist(id) {
  const product = getProduct(id);
  if (!product) return;
  const list = getWishlist();
  const saved = list.includes(id);
  const next = saved ? list.filter(item => item !== id) : [...list, id];
  store.set(WISH_KEY, next);
  updateCounts();
  syncWishlistButtons();
  showToast(saved ? 'Removed from saved pieces' : 'Saved to your list', saved ? {} : { href: 'shop.html?saved=1', action: 'View saved' });
  document.dispatchEvent(new CustomEvent('wishlist:change', { detail: { id, saved: !saved } }));
}

export function syncWishlistButtons() {
  document.querySelectorAll('[data-wishlist]').forEach(button => {
    const product = getProduct(button.dataset.wishlist);
    if (!product) return;
    const saved = isSaved(product.id);
    button.classList.toggle('is-saved', saved);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', saved ? `Remove ${product.name} from saved pieces` : `Save ${product.name}`);
  });
}

export function addToCart(id, size, color, qty = 1) {
  const product = getProduct(id);
  if (!product) return;
  const items = getCart();
  const key = cartItemKey({ id, size, color });
  const existing = items.find(item => cartItemKey(item) === key);
  if (existing) {
    existing.qty = Math.min(9, existing.qty + qty);
  } else {
    items.push({ id, size, color, qty: Math.min(9, qty) });
  }
  saveCart(items);
  openCart();
}

function removeCartItem(key) {
  saveCart(getCart().filter(item => cartItemKey(item) !== key));
}

function changeCartQty(key, delta) {
  const items = getCart();
  const item = items.find(entry => cartItemKey(entry) === key);
  if (!item) return;
  item.qty = Math.min(9, Math.max(0, item.qty + delta));
  saveCart(item.qty === 0 ? items.filter(entry => cartItemKey(entry) !== key) : items);
}

export function productCard(product, options = {}) {
  const saved = isSaved(product.id);
  const badgeClass = product.badge === 'Limited' ? 'badge badge--limited' : 'badge';
  const badge = product.badge ? `<span class="${badgeClass}">${escapeHtml(product.badge)}</span>` : '';
  const visibleColors = product.colors.slice(0, 4);
  const extraColors = product.colors.length - visibleColors.length;
  const swatches = visibleColors
    .map(color => `<span class="swatch" style="background:${color.hex}" title="${escapeHtml(color.name)}"></span>`)
    .join('');
  const reveal = options.reveal === false ? '' : `data-reveal style="--delay:${(options.delay || 0).toFixed(2)}s"`;
  return `
    <article class="product-card" ${reveal}>
      <div class="product-card__frame">
        <a class="product-card__media" href="product.html?id=${product.id}" aria-label="View ${escapeHtml(product.name)}">
          <img src="${product.image}" alt="${escapeHtml(product.name)} in ${escapeHtml(product.colors[0].name)}" loading="${options.eager ? 'eager' : 'lazy'}" width="900" height="1200">
          ${badge}
        </a>
        <button class="wish-btn${saved ? ' is-saved' : ''}" type="button" data-wishlist="${product.id}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Save'} ${escapeHtml(product.name)}">
          ${icon('heart')}
        </button>
        <button class="quick-add" type="button" data-quick-add="${product.id}">Quick add</button>
      </div>
      <div class="product-card__info">
        <div>
          <h3 class="product-card__name"><a href="product.html?id=${product.id}">${escapeHtml(product.name)}</a></h3>
          <p class="product-card__meta">${escapeHtml(productLabel(product))}</p>
        </div>
        <span class="price">${money(product.price)}</span>
      </div>
      <div class="swatches">${swatches}${extraColors > 0 ? `<span class="swatch-more">+${extraColors}</span>` : ''}</div>
    </article>`;
}

const openLayers = new Set();

function syncLock() {
  document.body.classList.toggle('is-locked', openLayers.size > 0);
}

function syncOverlay() {
  const overlay = document.getElementById('site-overlay');
  if (!overlay) return;
  overlay.classList.toggle('is-open', Boolean(document.querySelector('.drawer.is-open')));
}

function openLayer(element) {
  if (!element || openLayers.has(element)) return;
  element._returnFocus = document.activeElement;
  element.classList.add('is-open');
  openLayers.add(element);
  syncLock();
  syncOverlay();
}

function closeLayer(element) {
  if (!element) return;
  element.classList.remove('is-open');
  openLayers.delete(element);
  syncLock();
  syncOverlay();
  if (element._returnFocus && document.contains(element._returnFocus)) {
    window.setTimeout(() => element._returnFocus.focus(), 40);
  }
}

function getTopLayer() {
  const layers = Array.from(
    document.querySelectorAll('.lightbox.is-open, .modal.is-open, .search-panel.is-open, .drawer.is-open, .shop-sidebar.is-open')
  );
  return layers[layers.length - 1] || null;
}

function trapFocus(event) {
  const layer = getTopLayer();
  if (!layer) return;
  const focusable = Array.from(
    layer.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!layer.contains(document.activeElement)) {
    event.preventDefault();
    first.focus();
    return;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openModal(modal) {
  openLayer(modal);
  const focusTarget = modal.querySelector('input, button, a[href]');
  if (focusTarget) window.setTimeout(() => focusTarget.focus(), 60);
}

function closeModal(modal) {
  closeLayer(modal);
}

function closeTransientLayers() {
  closeLayer(document.getElementById('quick-add-modal'));
  closeLayer(document.getElementById('size-guide-modal'));
}

function openCart() {
  closeMenu();
  closeTransientLayers();
  renderCart();
  openLayer(document.getElementById('cart-drawer'));
  window.setTimeout(() => document.querySelector('#cart-drawer [data-close-cart]')?.focus(), 60);
}

function closeCart() {
  closeLayer(document.getElementById('cart-drawer'));
}

function openMenu() {
  closeCart();
  closeTransientLayers();
  openLayer(document.getElementById('menu-drawer'));
  window.setTimeout(() => document.querySelector('#menu-drawer [data-close-menu]')?.focus(), 60);
}

function closeMenu() {
  closeLayer(document.getElementById('menu-drawer'));
}

function closeAllDrawers() {
  closeCart();
  closeMenu();
}

function openSearch() {
  closeAllDrawers();
  closeTransientLayers();
  const panel = document.getElementById('search-panel');
  openLayer(panel);
  const input = document.getElementById('search-input');
  if (input) {
    input.value = '';
    renderSearch('');
    window.setTimeout(() => input.focus(), 80);
  }
}

function closeSearch() {
  closeLayer(document.getElementById('search-panel'));
}

function renderCart() {
  const body = document.getElementById('cart-body');
  const foot = document.getElementById('cart-foot');
  if (!body || !foot) return;
  const items = getCart();
  const { subtotal, shipping, total } = getTotals(items);
  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const label = document.getElementById('cart-count-label');
  if (label) label.textContent = `(${count})`;

  if (!items.length) {
    body.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty__icon">${icon('bag')}</div>
        <h3>Your bag is empty</h3>
        <p>Start with a piece you will reach for every day. Our essentials are a good place to begin.</p>
        <a class="btn btn--primary" href="shop.html">Explore the collection</a>
      </div>`;
    foot.innerHTML = '';
    foot.hidden = true;
    return;
  }

  foot.hidden = false;
  const remaining = Math.max(0, FREE_SHIPPING - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING) * 100);
  body.innerHTML = `
    <div class="ship-progress">
      <p>${remaining > 0 ? `You are <strong>${money(remaining)}</strong> away from complimentary shipping.` : 'You have unlocked complimentary shipping.'}</p>
      <div class="ship-progress__bar"><div class="ship-progress__fill" style="width:${progress}%"></div></div>
    </div>
    ${items
      .map(item => {
        const product = getProduct(item.id);
        const key = cartItemKey(item);
        return `
          <div class="cart-line">
            <a class="cart-line__media" href="product.html?id=${product.id}">
              <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" width="900" height="1200">
            </a>
            <div>
              <p class="cart-line__name"><a href="product.html?id=${product.id}">${escapeHtml(product.name)}</a></p>
              <p class="cart-line__meta">${escapeHtml(item.color)} / ${escapeHtml(item.size)}</p>
              <div class="cart-line__bottom">
                <div class="qty">
                  <button type="button" data-cart-qty="-1" data-key="${escapeHtml(key)}" aria-label="Decrease quantity">${icon('minus')}</button>
                  <span>${item.qty}</span>
                  <button type="button" data-cart-qty="1" data-key="${escapeHtml(key)}" aria-label="Increase quantity">${icon('plus')}</button>
                </div>
                <button class="cart-line__remove" type="button" data-cart-remove="${escapeHtml(key)}">Remove</button>
              </div>
            </div>
            <span class="cart-line__price">${money(product.price * item.qty)}</span>
          </div>`;
      })
      .join('')}`;

  foot.innerHTML = `
    <div class="cart-summary">
      <div class="cart-summary__row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
      <div class="cart-summary__row"><span>Shipping</span><span>${shipping === 0 ? 'Complimentary' : money(shipping)}</span></div>
      <div class="cart-summary__row cart-summary__row--total"><span>Total</span><span>${money(total)}</span></div>
    </div>
    <div class="cart-foot__actions">
      <button class="btn btn--primary btn--full" type="button" id="cart-checkout">Checkout</button>
      <button class="btn btn--outline btn--full" type="button" data-close-cart>Continue shopping</button>
    </div>
    <p class="cart-note">Taxes calculated at checkout · Complimentary returns within 30 days</p>`;
}

function renderSearch(query) {
  const content = document.getElementById('search-content');
  if (!content) return;
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    const picks = ['atelier-coat', 'bias-slip', 'essential-tee', 'cloud-knit'].map(getProduct).filter(Boolean);
    content.innerHTML = `
      <div class="search-section">
        <h3 class="search-section__title">Popular searches</h3>
        <div class="search-chips">
          ${['Wool coat', 'Silk dress', 'Knitwear', 'Denim', 'Essentials']
            .map(term => `<button class="search-chip" type="button" data-search-term="${term}">${term}</button>`)
            .join('')}
        </div>
      </div>
      <div class="search-section">
        <h3 class="search-section__title">New this week</h3>
        <div class="search-results">${picks.map(searchResult).join('')}</div>
      </div>`;
    return;
  }

  const results = PRODUCTS.filter(product => {
    const haystack = `${product.name} ${product.description} ${product.tags.join(' ')} ${product.colors.map(color => color.name).join(' ')} ${product.badge || ''}`.toLowerCase();
    return haystack.includes(normalized);
  }).slice(0, 8);

  content.innerHTML = results.length
    ? `<div class="search-section">
        <h3 class="search-section__title">${results.length} ${results.length === 1 ? 'piece' : 'pieces'} for “${escapeHtml(query.trim())}”</h3>
        <div class="search-results">${results.map(searchResult).join('')}</div>
      </div>`
    : `<div class="search-empty">No pieces match “${escapeHtml(query.trim())}”. Try “coat”, “silk” or “knit”.</div>`;
}

function searchResult(product) {
  return `
    <a class="search-result" href="product.html?id=${product.id}">
      <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" width="900" height="1200">
      <div>
        <h4>${escapeHtml(product.name)}</h4>
        <p>${escapeHtml(productLabel(product))}</p>
      </div>
      <span class="price">${money(product.price)}</span>
    </a>`;
}

function openQuickAdd(id) {
  const product = getProduct(id);
  const modal = document.getElementById('quick-add-modal');
  const content = document.getElementById('quick-add-content');
  if (!product || !modal || !content) return;
  let selectedColor = product.colors[0].name;
  let selectedSize = product.sizes.length === 1 ? product.sizes[0] : null;
  content.innerHTML = `
    <div class="quick-add-card__media">
      <img src="${product.image}" alt="${escapeHtml(product.name)}" width="900" height="1200">
    </div>
    <div class="quick-add-card__body">
      <span class="eyebrow">${escapeHtml(productLabel(product))}</span>
      <h3>${escapeHtml(product.name)}</h3>
      <p class="quick-add-card__price">${money(product.price)}</p>
      <p class="quick-add-card__desc">${escapeHtml(product.description)}</p>
      <div class="option-block">
        <div class="option-block__head"><strong>Colour</strong><span data-quick-color-label>${escapeHtml(selectedColor)}</span></div>
        <div class="color-options">
          ${product.colors
            .map(
              color =>
                `<button class="color-option${color.name === selectedColor ? ' is-active' : ''}" type="button" data-quick-color="${escapeHtml(color.name)}" style="background:${color.hex}" aria-label="${escapeHtml(color.name)}" aria-pressed="${color.name === selectedColor}" title="${escapeHtml(color.name)}"></button>`
            )
            .join('')}
        </div>
      </div>
      <div class="option-block">
        <div class="option-block__head"><strong>Size</strong><span data-quick-size-label>${selectedSize ? escapeHtml(selectedSize) : 'Select'}</span></div>
        <div class="size-options">
          ${product.sizes
            .map(
              size =>
                `<button class="size-option${size === selectedSize ? ' is-active' : ''}" type="button" data-quick-size="${escapeHtml(size)}" aria-pressed="${size === selectedSize}">${escapeHtml(size)}</button>`
            )
            .join('')}
        </div>
      </div>
      <p class="quick-add-card__error" data-quick-error>Please select a size.</p>
      <div class="quick-add-card__actions">
        <button class="btn btn--primary" type="button" data-quick-add-submit>Add to bag — ${money(product.price)}</button>
        <button class="wish-btn${isSaved(product.id) ? ' is-saved' : ''}" type="button" data-wishlist="${product.id}" aria-pressed="${isSaved(product.id)}" aria-label="${isSaved(product.id) ? 'Remove' : 'Save'} ${escapeHtml(product.name)}">${icon('heart')}</button>
      </div>
      <a class="quick-add-card__link" href="product.html?id=${product.id}">View full details</a>
    </div>`;

  content.querySelectorAll('[data-quick-color]').forEach(button => {
    button.addEventListener('click', () => {
      selectedColor = button.dataset.quickColor;
      content.querySelectorAll('[data-quick-color]').forEach(el => {
        el.classList.toggle('is-active', el === button);
        el.setAttribute('aria-pressed', String(el === button));
      });
      const label = content.querySelector('[data-quick-color-label]');
      if (label) label.textContent = selectedColor;
    });
  });

  content.querySelectorAll('[data-quick-size]').forEach(button => {
    button.addEventListener('click', () => {
      selectedSize = button.dataset.quickSize;
      content.querySelectorAll('[data-quick-size]').forEach(el => {
        el.classList.toggle('is-active', el === button);
        el.setAttribute('aria-pressed', String(el === button));
      });
      const label = content.querySelector('[data-quick-size-label]');
      if (label) label.textContent = selectedSize;
      content.querySelector('[data-quick-error]')?.classList.remove('is-visible');
    });
  });

  content.querySelector('[data-quick-add-submit]')?.addEventListener('click', () => {
    if (!selectedSize) {
      content.querySelector('[data-quick-error]')?.classList.add('is-visible');
      return;
    }
    closeModal(modal);
    addToCart(product.id, selectedSize, selectedColor, 1);
  });

  openModal(modal);
}

export function openLightbox(src, alt) {
  const lightbox = document.getElementById('lightbox');
  const image = document.getElementById('lightbox-img');
  if (!lightbox || !image) return;
  image.src = src;
  image.alt = alt || '';
  openLayer(lightbox);
  window.setTimeout(() => lightbox.querySelector('[data-close-lightbox]')?.focus(), 60);
}

function closeLightbox() {
  closeLayer(document.getElementById('lightbox'));
}

function initHeader() {
  const header = document.querySelector('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const page = document.body.dataset.page;
  document.querySelectorAll('.nav-main a, .menu-nav a').forEach(link => {
    const href = link.getAttribute('href') || '';
    if (page === 'about' && href === 'about.html') link.setAttribute('aria-current', 'page');
    if (page === 'shop' && href === 'shop.html') link.setAttribute('aria-current', 'page');
    if (page === 'product' && href === 'shop.html') link.setAttribute('aria-current', 'page');
  });
}

export function initReveal(scope = document) {
  const elements = Array.from(scope.querySelectorAll('[data-reveal]:not(.is-visible)'));
  if (!elements.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    elements.forEach(element => element.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  elements.forEach(element => observer.observe(element));
}

function formatDeliveryRange() {
  const start = new Date();
  const end = new Date();
  start.setDate(start.getDate() + 4);
  end.setDate(end.getDate() + 7);
  const month = date => date.toLocaleString('en-US', { month: 'short' });
  return `${month(start)} ${start.getDate()} – ${month(end)} ${end.getDate()}`;
}

function renderCheckout() {
  const items = getCart();
  const itemsEl = document.getElementById('checkout-items');
  const totalsEl = document.getElementById('checkout-totals');
  const submitText = document.getElementById('checkout-submit-text');
  if (!itemsEl || !totalsEl || !submitText) return;
  const { subtotal, shipping, total } = getTotals(items);
  itemsEl.innerHTML = items
    .map(item => {
      const product = getProduct(item.id);
      return `
        <div class="checkout-item">
          <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" width="900" height="1200">
          <div>
            <p class="checkout-item__name">${escapeHtml(product.name)}</p>
            <p class="checkout-item__meta">${escapeHtml(item.color)} / ${escapeHtml(item.size)} · Qty ${item.qty}</p>
          </div>
          <span class="checkout-item__price">${money(product.price * item.qty)}</span>
        </div>`;
    })
    .join('');
  totalsEl.innerHTML = `
    <div class="cart-summary__row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
    <div class="cart-summary__row"><span>Shipping</span><span>${shipping === 0 ? 'Complimentary' : money(shipping)}</span></div>
    <div class="cart-summary__row cart-summary__row--total"><span>Total</span><span>${money(total)}</span></div>`;
  submitText.textContent = `Place order — ${money(total)}`;
}

function openCheckout() {
  if (!getCart().length) return;
  closeCart();
  const card = document.getElementById('checkout-modal-card');
  const modal = document.getElementById('checkout-modal');
  if (!card || !modal) return;
  if (card.classList.contains('is-complete')) {
    card.classList.remove('is-complete');
    document.getElementById('checkout-form')?.reset();
    document.querySelectorAll('#checkout-form .field').forEach(field => field.classList.remove('is-error'));
    renderCheckout();
  }
  renderCheckout();
  openModal(modal);
  window.setTimeout(() => document.getElementById('checkout-email')?.focus(), 120);
}

let checkoutComplete = false;

function closeCheckout() {
  const card = document.getElementById('checkout-modal-card');
  const modal = document.getElementById('checkout-modal');
  closeLayer(modal);
  if (checkoutComplete) {
    checkoutComplete = false;
    window.setTimeout(() => {
      card?.classList.remove('is-complete');
      document.getElementById('checkout-form')?.reset();
      document.querySelectorAll('#checkout-form .field').forEach(field => field.classList.remove('is-error'));
      const submitText = document.getElementById('checkout-submit-text');
      if (submitText) submitText.textContent = 'Place order';
    }, 420);
  }
}

function setFieldError(input, message) {
  const field = input.closest('.field');
  if (!field) return;
  field.classList.add('is-error');
  const error = field.querySelector('.field__error');
  if (error && message) error.textContent = message;
}

function clearFieldError(input) {
  input.closest('.field')?.classList.remove('is-error');
}

function validateCheckout() {
  const email = document.getElementById('checkout-email');
  const firstName = document.getElementById('checkout-first');
  const lastName = document.getElementById('checkout-last');
  const address = document.getElementById('checkout-address');
  const city = document.getElementById('checkout-city');
  const postal = document.getElementById('checkout-postal');
  const country = document.getElementById('checkout-country');
  const card = document.getElementById('checkout-card');
  const expiry = document.getElementById('checkout-expiry');
  const cvc = document.getElementById('checkout-cvc');
  const fields = [email, firstName, lastName, address, city, postal, country, card, expiry, cvc];
  fields.forEach(clearFieldError);
  let valid = true;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    setFieldError(email, 'Please enter a valid email address.');
    valid = false;
  }
  [firstName, lastName, address, city].forEach(input => {
    if (!input.value.trim()) {
      setFieldError(input, 'This field is required.');
      valid = false;
    }
  });
  if (postal.value.trim().length < 3) {
    setFieldError(postal, 'Please enter a valid postal code.');
    valid = false;
  }
  if (!country.value) {
    setFieldError(country, 'Please select a country.');
    valid = false;
  }
  const digits = card.value.replace(/\D/g, '');
  if (digits.length < 15 || digits.length > 16) {
    setFieldError(card, 'Please enter a valid card number.');
    valid = false;
  }
  if (!/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/.test(expiry.value.trim())) {
    setFieldError(expiry, 'Use MM / YY format.');
    valid = false;
  }
  if (!/^\d{3,4}$/.test(cvc.value.trim())) {
    setFieldError(cvc, '3 or 4 digits.');
    valid = false;
  }

  if (!valid) {
    const firstError = document.querySelector('#checkout-form .field.is-error input, #checkout-form .field.is-error select');
    firstError?.focus();
  }
  return valid;
}

function completeOrder(email) {
  const order = `ECR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const card = document.getElementById('checkout-modal-card');
  document.getElementById('success-email').textContent = email;
  document.getElementById('success-order').textContent = order;
  document.getElementById('success-delivery').textContent = formatDeliveryRange();
  saveCart([]);
  renderCart();
  updateCounts();
  checkoutComplete = true;
  card?.classList.add('is-complete');
  document.getElementById('checkout-modal')?.scrollTo({ top: 0 });
}

function initCheckout() {
  const form = document.getElementById('checkout-form');
  if (!form) return;
  const cardInput = document.getElementById('checkout-card');
  const expiryInput = document.getElementById('checkout-expiry');
  const cvcInput = document.getElementById('checkout-cvc');

  cardInput?.addEventListener('input', () => {
    const digits = cardInput.value.replace(/\D/g, '').slice(0, 16);
    cardInput.value = digits.replace(/(.{4})/g, '$1 ').trim();
    clearFieldError(cardInput);
  });
  expiryInput?.addEventListener('input', () => {
    const digits = expiryInput.value.replace(/\D/g, '').slice(0, 4);
    expiryInput.value = digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
    clearFieldError(expiryInput);
  });
  cvcInput?.addEventListener('input', () => {
    cvcInput.value = cvcInput.value.replace(/\D/g, '').slice(0, 4);
    clearFieldError(cvcInput);
  });
  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', () => clearFieldError(input));
    input.addEventListener('change', () => clearFieldError(input));
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validateCheckout()) return;
    const email = document.getElementById('checkout-email').value.trim();
    const button = form.querySelector('.checkout__submit');
    const submitText = document.getElementById('checkout-submit-text');
    button.disabled = true;
    submitText.textContent = 'Placing order…';
    window.setTimeout(() => {
      button.disabled = false;
      completeOrder(email);
    }, 1400);
  });
}

function initNewsletter() {
  document.querySelectorAll('[data-newsletter]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input) return;
      const value = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        showToast('Please enter a valid email address.');
        return;
      }
      input.removeAttribute('aria-invalid');
      store.set(NEWSLETTER_KEY, { email: value, date: new Date().toISOString() });
      form.classList.add('is-done');
      const success = form.querySelector('.newsletter__success');
      if (success) success.querySelector('span').textContent = `Welcome in. A quiet note is on its way to ${value}.`;
      showToast('You are on the list.');
    });
  });
}

function injectChrome() {
  const checkoutCountries = ['United States', 'United Kingdom', 'Canada', 'Denmark', 'Portugal', 'Germany', 'France', 'Australia', 'Japan'];
  document.body.insertAdjacentHTML(
    'beforeend',
    `
    <div class="overlay" id="site-overlay"></div>
    <aside class="drawer" id="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <header class="drawer__head">
        <h2 class="drawer__title">Your bag <span id="cart-count-label">(0)</span></h2>
        <button class="drawer-close" type="button" data-close-cart aria-label="Close bag">${icon('close')}</button>
      </header>
      <div class="drawer__body" id="cart-body"></div>
      <div class="drawer__foot" id="cart-foot"></div>
    </aside>
    <aside class="drawer drawer--left menu-drawer" id="menu-drawer" role="dialog" aria-modal="true" aria-label="Menu">
      <header class="drawer__head">
        <span class="eyebrow">Menu</span>
        <button class="drawer-close" type="button" data-close-menu aria-label="Close menu">${icon('close')}</button>
      </header>
      <div class="drawer__body">
        <nav class="menu-nav" aria-label="Mobile">
          <a href="shop.html">Shop all <span>20 pieces</span></a>
          <a href="shop.html?category=women">Women <span>10</span></a>
          <a href="shop.html?category=men">Men <span>10</span></a>
          <a href="shop.html?category=knitwear">Knitwear <span>03</span></a>
          <a href="about.html">Our story <span>Since 2018</span></a>
        </nav>
        <div class="menu-meta">
          <button type="button" data-open-search>Search</button>
          <a href="shop.html?saved=1">Saved pieces</a>
          <a href="about.html">Our atelier</a>
          <a href="mailto:hello@ecru.studio">Contact</a>
          <span>USD $</span>
        </div>
      </div>
    </aside>
    <div class="search-panel" id="search-panel" role="dialog" aria-modal="true" aria-label="Search">
      <header class="search-panel__head">
        <span class="eyebrow">Search Écru</span>
        <button class="drawer-close" type="button" data-close-search aria-label="Close search">${icon('close')}</button>
      </header>
      <div class="search-panel__body">
        <div class="search-panel__inner">
          <form class="search-form" id="search-form" role="search">
            ${icon('search')}
            <input class="search-input" id="search-input" type="search" placeholder="Search the collection" autocomplete="off" aria-label="Search products">
            <button class="icon-btn" type="submit" aria-label="Submit search">${icon('arrowRight')}</button>
          </form>
          <p class="search-hint">Press Esc to close · Try “wool”, “silk” or “denim”</p>
          <div id="search-content"></div>
        </div>
      </div>
    </div>
    <div class="modal" id="quick-add-modal" role="dialog" aria-modal="true" aria-label="Quick add">
      <div class="modal__backdrop" data-close-modal></div>
      <div class="modal__card">
        <button class="modal__close" type="button" data-close-quick-add aria-label="Close quick add">${icon('close')}</button>
        <div class="quick-add-card" id="quick-add-content"></div>
      </div>
    </div>
    <div class="modal" id="size-guide-modal" role="dialog" aria-modal="true" aria-label="Size guide">
      <div class="modal__backdrop" data-close-modal></div>
      <div class="modal__card size-guide-card">
        <button class="modal__close" type="button" data-close-size-guide aria-label="Close size guide">${icon('close')}</button>
        <span class="eyebrow">Fit notes</span>
        <h3>Find your size</h3>
        <p>Our pieces are designed with a relaxed, lived-in fit. Measure against your body, not over clothing, and choose the size that feels closest to the ease you prefer.</p>
        <div class="size-table-wrap">
          <table class="size-table">
            <thead><tr><th>Size</th><th>Chest (cm)</th><th>Waist (cm)</th><th>Hip (cm)</th><th>US</th><th>UK</th><th>EU</th></tr></thead>
            <tbody>
              <tr><td>XS</td><td>82–86</td><td>64–68</td><td>90–94</td><td>2</td><td>6</td><td>34</td></tr>
              <tr><td>S</td><td>87–91</td><td>69–73</td><td>95–99</td><td>4–6</td><td>8–10</td><td>36–38</td></tr>
              <tr><td>M</td><td>92–97</td><td>74–79</td><td>100–105</td><td>8–10</td><td>12–14</td><td>40–42</td></tr>
              <tr><td>L</td><td>98–103</td><td>80–85</td><td>106–111</td><td>12–14</td><td>16–18</td><td>44–46</td></tr>
              <tr><td>XL</td><td>104–110</td><td>86–92</td><td>112–118</td><td>16</td><td>20</td><td>48</td></tr>
              <tr><td>XXL</td><td>111–117</td><td>93–99</td><td>119–125</td><td>18</td><td>22</td><td>50</td></tr>
            </tbody>
          </table>
        </div>
        <p class="size-guide-note">Between sizes? Our outerwear is cut generously, while knitwear and silk sit close. When in doubt, size up for outerwear and down for knitwear. Questions? Write to <a href="mailto:hello@ecru.studio">hello@ecru.studio</a>.</p>
      </div>
    </div>
    <div class="modal" id="checkout-modal" role="dialog" aria-modal="true" aria-label="Checkout">
      <div class="modal__backdrop" data-close-modal></div>
      <div class="modal__card checkout-card" id="checkout-modal-card">
        <header class="checkout__head">
          <h2>Checkout</h2>
          <span class="checkout__secure">${icon('lock')} Secure demo checkout</span>
          <button class="drawer-close" type="button" data-close-checkout aria-label="Close checkout">${icon('close')}</button>
        </header>
        <div class="checkout__grid">
          <div class="checkout__form">
            <form id="checkout-form" novalidate>
              <div class="checkout__section">
                <div class="checkout__section-title"><span>1</span> Contact</div>
                <div class="field">
                  <label for="checkout-email">Email</label>
                  <input id="checkout-email" type="email" autocomplete="email" placeholder="you@example.com">
                  <span class="field__error">Please enter a valid email address.</span>
                </div>
              </div>
              <div class="checkout__section">
                <div class="checkout__section-title"><span>2</span> Shipping address</div>
                <div class="field-row">
                  <div class="field"><label for="checkout-first">First name</label><input id="checkout-first" autocomplete="given-name"><span class="field__error">This field is required.</span></div>
                  <div class="field"><label for="checkout-last">Last name</label><input id="checkout-last" autocomplete="family-name"><span class="field__error">This field is required.</span></div>
                </div>
                <div class="field"><label for="checkout-address">Address</label><input id="checkout-address" autocomplete="address-line1" placeholder="Street and number"><span class="field__error">This field is required.</span></div>
                <div class="field"><label for="checkout-apt">Apartment, suite (optional)</label><input id="checkout-apt" autocomplete="address-line2"></div>
                <div class="field-row">
                  <div class="field"><label for="checkout-city">City</label><input id="checkout-city" autocomplete="address-level2"><span class="field__error">This field is required.</span></div>
                  <div class="field"><label for="checkout-postal">Postal code</label><input id="checkout-postal" autocomplete="postal-code"><span class="field__error">Please enter a valid postal code.</span></div>
                </div>
                <div class="field">
                  <label for="checkout-country">Country</label>
                  <select id="checkout-country" autocomplete="country-name">
                    <option value="">Select country</option>
                    ${checkoutCountries.map(country => `<option value="${country}">${country}</option>`).join('')}
                  </select>
                  <span class="field__error">Please select a country.</span>
                </div>
              </div>
              <div class="checkout__section">
                <div class="checkout__section-title"><span>3</span> Payment</div>
                <div class="field">
                  <label for="checkout-card">Card number</label>
                  <input id="checkout-card" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="19">
                  <span class="field__error">Please enter a valid card number.</span>
                </div>
                <div class="field-row">
                  <div class="field"><label for="checkout-expiry">Expiry</label><input id="checkout-expiry" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY" maxlength="7"><span class="field__error">Use MM / YY format.</span></div>
                  <div class="field"><label for="checkout-cvc">Security code</label><input id="checkout-cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="CVC" maxlength="4"><span class="field__error">3 or 4 digits.</span></div>
                </div>
              </div>
              <button class="btn btn--primary btn--full checkout__submit" type="submit"><span id="checkout-submit-text">Place order</span></button>
              <p class="checkout__demo">Demo checkout — no payment will be processed.</p>
            </form>
          </div>
          <aside class="checkout__summary">
            <div class="checkout__section-title">Order summary</div>
            <div class="checkout__items" id="checkout-items"></div>
            <div class="checkout__totals" id="checkout-totals"></div>
            <p class="cart-note">Complimentary carbon-neutral delivery over $150 · 30-day returns</p>
          </aside>
        </div>
        <div class="checkout__success" id="checkout-success">
          <div class="checkout__success-icon">${icon('check')}</div>
          <h2>Thank you. Your order is in.</h2>
          <p>A confirmation is on its way to <span id="success-email"></span>. We will send tracking as soon as your pieces leave the atelier.</p>
          <span class="order-number">Order <span id="success-order"></span></span>
          <p class="checkout__demo">Estimated delivery <span id="success-delivery"></span></p>
          <div class="checkout__success-actions">
            <a class="btn btn--primary" href="shop.html">Continue shopping</a>
            <button class="btn btn--outline" type="button" data-close-checkout>Close</button>
          </div>
        </div>
      </div>
    </div>
    <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Product image">
      <button class="lightbox__close" type="button" data-close-lightbox aria-label="Close image">${icon('close')}</button>
      <img id="lightbox-img" alt="">
    </div>
    <div class="toast-stack" id="toast-stack" aria-live="polite" aria-atomic="false"></div>`
  );
}

function isTyping(target) {
  return target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);
}

function bindEvents() {
  document.addEventListener('click', event => {
    const openCartButton = event.target.closest('[data-open-cart]');
    if (openCartButton) {
      event.preventDefault();
      openCart();
      return;
    }

    const openMenuButton = event.target.closest('[data-open-menu]');
    if (openMenuButton) {
      event.preventDefault();
      openMenu();
      return;
    }

    const openSearchButton = event.target.closest('[data-open-search]');
    if (openSearchButton) {
      event.preventDefault();
      openSearch();
      return;
    }

    if (event.target.closest('[data-close-cart]')) {
      closeCart();
      return;
    }

    if (event.target.closest('[data-close-menu]')) {
      closeMenu();
      return;
    }

    if (event.target.closest('[data-close-search]')) {
      closeSearch();
      return;
    }

    if (event.target.closest('[data-close-quick-add]')) {
      closeLayer(document.getElementById('quick-add-modal'));
      return;
    }

    if (event.target.closest('[data-open-size-guide]')) {
      event.preventDefault();
      openModal(document.getElementById('size-guide-modal'));
      return;
    }

    if (event.target.closest('[data-close-size-guide]')) {
      closeLayer(document.getElementById('size-guide-modal'));
      return;
    }

    if (event.target.closest('[data-close-checkout]')) {
      closeCheckout();
      return;
    }

    if (event.target.closest('[data-close-lightbox]')) {
      closeLightbox();
      return;
    }

    if (event.target.matches('[data-close-modal]')) {
      const modal = event.target.closest('.modal');
      if (!modal) return;
      if (modal.id === 'checkout-modal') closeCheckout();
      else closeLayer(modal);
      return;
    }

    if (event.target.id === 'site-overlay') {
      closeAllDrawers();
      return;
    }

    const wishButton = event.target.closest('[data-wishlist]');
    if (wishButton) {
      event.preventDefault();
      toggleWishlist(wishButton.dataset.wishlist);
      return;
    }

    const quickAddButton = event.target.closest('[data-quick-add]');
    if (quickAddButton) {
      event.preventDefault();
      openQuickAdd(quickAddButton.dataset.quickAdd);
      return;
    }

    const cartQtyButton = event.target.closest('[data-cart-qty]');
    if (cartQtyButton) {
      changeCartQty(cartQtyButton.dataset.key, Number(cartQtyButton.dataset.cartQty));
      return;
    }

    const cartRemoveButton = event.target.closest('[data-cart-remove]');
    if (cartRemoveButton) {
      removeCartItem(cartRemoveButton.dataset.cartRemove);
      return;
    }

    if (event.target.closest('#cart-checkout')) {
      openCheckout();
      return;
    }

    const searchTerm = event.target.closest('[data-search-term]');
    if (searchTerm) {
      const input = document.getElementById('search-input');
      if (!input) return;
      input.value = searchTerm.dataset.searchTerm;
      renderSearch(input.value);
      input.focus();
    }
  });

  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', event => {
      event.preventDefault();
      const query = searchInput.value.trim();
      if (!query) {
        searchInput.focus();
        return;
      }
      window.location.href = `shop.html?q=${encodeURIComponent(query)}`;
    });
    searchInput.addEventListener('input', () => renderSearch(searchInput.value));
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const top = getTopLayer();
      if (!top) return;
      if (top.id === 'lightbox') closeLightbox();
      else if (top.id === 'checkout-modal') closeCheckout();
      else if (top.id === 'quick-add-modal' || top.id === 'size-guide-modal') closeLayer(top);
      else if (top.id === 'search-panel') closeSearch();
      else if (top.id === 'cart-drawer') closeCart();
      else if (top.id === 'menu-drawer') closeMenu();
      return;
    }

    if (event.key === 'Tab') {
      trapFocus(event);
      return;
    }

    const shortcut = event.key === '/' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k');
    if (shortcut && !isTyping(event.target) && !getTopLayer()) {
      event.preventDefault();
      openSearch();
    }
  });
}

export function initApp() {
  if (document.body.dataset.appReady === 'true') return;
  document.body.dataset.appReady = 'true';
  injectChrome();
  initHeader();
  initCheckout();
  initNewsletter();
  bindEvents();
  updateCounts();
  syncWishlistButtons();
  renderCart();
  initReveal();
}

initApp();
