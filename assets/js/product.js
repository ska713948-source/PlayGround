import { PRODUCTS, TAG_LABELS, getProduct, primaryTag } from './data.js';
import {
  addToCart,
  openLightbox,
  productCard,
  initReveal,
  starRating,
  icon,
  money,
  syncWishlistButtons
} from './app.js';

const main = document.getElementById('product-main');
const params = new URLSearchParams(window.location.search);
const product = getProduct(params.get('id'));

if (!main) {
  throw new Error('Product main element is missing.');
}

function tagLabel(tag) {
  return TAG_LABELS[tag] || tag;
}

function renderNotFound() {
  document.title = 'Piece not found — ÉCRU';
  main.innerHTML = `
    <section class="product-page">
      <div class="container">
        <nav class="breadcrumbs product-page__crumbs" aria-label="Breadcrumb">
          <a href="index.html">Home</a><span>/</span><a href="shop.html">Collection</a><span>/</span><span>Not found</span>
        </nav>
        <div class="shop-empty">
          <p class="eyebrow">404 — Piece not found</p>
          <h2>This piece has moved on.</h2>
          <p>It may have sold out or the link may be incomplete. The rest of the collection is waiting.</p>
          <a class="btn btn--primary" href="shop.html">Explore the collection</a>
        </div>
      </div>
    </section>`;
}

function relatedProducts() {
  const currentTags = new Set(product.tags);
  return PRODUCTS.filter(item => item.id !== product.id)
    .map(item => ({
      item,
      score: item.tags.filter(tag => currentTags.has(tag)).length * 2 + Number(Boolean(item.new))
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(entry => entry.item);
}

function renderProduct() {
  document.title = `${product.name} — ÉCRU`;
  const collection = primaryTag(product);
  const related = relatedProducts();
  const wishLabel = `Save ${product.name}`;
  const details = product.details.map(detail => `<li>${detail}</li>`).join('');

  main.innerHTML = `
    <section class="product-page">
      <div class="container">
        <nav class="breadcrumbs product-page__crumbs" aria-label="Breadcrumb">
          <a href="index.html">Home</a><span>/</span>
          <a href="shop.html">Collection</a><span>/</span>
          <a href="shop.html?category=${collection}">${tagLabel(collection)}</a><span>/</span>
          <span>${product.name}</span>
        </nav>

        <div class="product-layout">
          <div class="gallery" data-reveal>
            <div class="gallery__thumbs" aria-label="Product image views">
              ${[1, 2, 3]
                .map(
                  index => `<button class="gallery__thumb${index === 1 ? ' is-active' : ''}" type="button" data-gallery="${index}" aria-label="View image ${index}">
                    <img class="crop-${index}" src="${product.image}" alt="" loading="${index === 1 ? 'eager' : 'lazy'}" width="600" height="800">
                  </button>`
                )
                .join('')}
            </div>
            <div class="gallery__main" id="gallery-main">
              <img id="gallery-image" class="crop-1" src="${product.image}" alt="${product.name}" width="1200" height="1500">
              <span class="gallery__counter" id="gallery-counter">01 / 03</span>
              <button class="gallery__zoom" type="button" id="gallery-zoom">${icon('zoom')} View</button>
            </div>
          </div>

          <div class="product-info" data-reveal style="--delay:0.08s">
            <p class="eyebrow product-info__collection">${tagLabel(collection)} · ${product.badge || 'Écru collection'}</p>
            <h1>${product.name}</h1>
            <p class="product-info__price">${money(product.price)}</p>
            <div class="product-info__rating">
              ${starRating(product.rating)}
              <span>${product.rating} · ${product.reviews} reviews</span>
            </div>
            <p class="product-info__desc">${product.description}</p>

            <div class="option-block" data-color-block>
              <div class="option-block__head"><strong>Colour</strong><span id="color-label">${product.colors[0].name}</span></div>
              <div class="color-options">
                ${product.colors
                  .map(
                    (color, index) =>
                      `<button class="color-option${index === 0 ? ' is-active' : ''}" type="button" data-color="${color.name}" style="background:${color.hex}" aria-label="${color.name}" aria-pressed="${index === 0}"></button>`
                  )
                  .join('')}
              </div>
            </div>

            <div class="option-block" data-size-block>
              <div class="option-block__head">
                <strong>Size</strong>
                <button type="button" data-open-size-guide>Size guide</button>
              </div>
              <div class="size-options">
                ${product.sizes
                  .map(
                    size =>
                      `<button class="size-option${product.sizes.length === 1 ? ' is-active' : ''}" type="button" data-size="${size}" aria-pressed="${product.sizes.length === 1}">${size}</button>`
                  )
                  .join('')}
              </div>
              <p class="product-info__error" id="product-error"></p>
            </div>

            <div class="option-block">
              <div class="option-block__head"><strong>Quantity</strong></div>
              <div class="qty buy-qty">
                <button type="button" data-product-qty="-1" aria-label="Decrease quantity">${icon('minus')}</button>
                <span id="product-qty">1</span>
                <button type="button" data-product-qty="1" aria-label="Increase quantity">${icon('plus')}</button>
              </div>
            </div>

            <div class="buy-row">
              <button class="btn btn--primary" type="button" id="add-to-bag">Add to bag — ${money(product.price)}</button>
              <button class="wish-btn" type="button" data-wishlist="${product.id}" aria-label="${wishLabel}">${icon('heart')}</button>
            </div>

            <div class="product-notes">
              <p class="product-note">${icon('truck')} Complimentary delivery over $150 · dispatched in 1–2 days</p>
              <p class="product-note">${icon('refresh')} 30-day returns, collected from your door</p>
              <p class="product-note">${icon('leaf')} Traceable fibres · carbon-neutral shipping</p>
            </div>

            <div class="accordion" id="product-accordion">
              <div class="accordion__item is-open">
                <button class="accordion__trigger" type="button" aria-expanded="true">Details &amp; care ${icon('plus')}</button>
                <div class="accordion__panel">
                  <div class="accordion__panel-inner">
                    <ul>${details}</ul>
                    <p>${product.fabric}</p>
                    <p>${product.care}</p>
                  </div>
                </div>
              </div>
              <div class="accordion__item">
                <button class="accordion__trigger" type="button" aria-expanded="false">Fit &amp; sizing ${icon('plus')}</button>
                <div class="accordion__panel">
                  <div class="accordion__panel-inner">
                    <p>${product.fit}</p>
                    <p>${product.model}</p>
                    <p>Between sizes? Our stylists are happy to help — write to atelier@ecru.studio.</p>
                  </div>
                </div>
              </div>
              <div class="accordion__item">
                <button class="accordion__trigger" type="button" aria-expanded="false">Shipping &amp; returns ${icon('plus')}</button>
                <div class="accordion__panel">
                  <div class="accordion__panel-inner">
                    <p>Orders leave our atelier within 1–2 business days. Standard delivery is complimentary over $150, otherwise $12.</p>
                    <p>Returns are accepted within 30 days of delivery in original condition. We arrange collection and issue a refund within five business days.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section class="related">
          <div class="section-head">
            <div>
              <p class="eyebrow">Continue the edit</p>
              <h2>You may also like</h2>
            </div>
            <a class="link-arrow" href="shop.html">View all pieces ${icon('arrowRight')}</a>
          </div>
          <div class="product-grid" id="related-grid">
            ${related.map((item, index) => productCard(item, { delay: index * 0.05 })).join('')}
          </div>
        </section>
      </div>
    </section>

    <div class="sticky-buy" id="sticky-buy">
      <img src="${product.image}" alt="" width="84" height="112">
      <div class="sticky-buy__text">
        <p class="sticky-buy__name">${product.name}</p>
        <p class="sticky-buy__price">${money(product.price)}</p>
      </div>
      <button class="btn btn--primary" type="button" id="sticky-add">Add to bag</button>
    </div>`;

  initProductInteractions();
  initReveal(main);
  syncWishlistButtons();
}

function initProductInteractions() {
  let selectedColor = product.colors[0].name;
  let selectedSize = product.sizes.length === 1 ? product.sizes[0] : null;
  let quantity = 1;

  const error = document.getElementById('product-error');

  const showError = message => {
    if (!error) return;
    error.textContent = message;
    error.classList.add('is-visible');
  };

  const clearError = () => {
    if (!error) return;
    error.textContent = '';
    error.classList.remove('is-visible');
  };

  const setColor = name => {
    selectedColor = name;
    const label = document.getElementById('color-label');
    if (label) label.textContent = name;
    main.querySelectorAll('[data-color]').forEach(button => {
      const active = button.dataset.color === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  const setSize = size => {
    selectedSize = size;
    main.querySelectorAll('[data-size]').forEach(button => {
      const active = button.dataset.size === size;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    clearError();
  };

  const setQuantity = value => {
    quantity = Math.min(9, Math.max(1, value));
    const label = document.getElementById('product-qty');
    if (label) label.textContent = String(quantity);
  };

  const add = () => {
    if (!selectedSize) {
      showError('Please choose a size before adding to your bag.');
      document.querySelector('[data-size-block]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    addToCart(product.id, selectedSize, selectedColor, quantity);
  };

  main.addEventListener('click', event => {
    const color = event.target.closest('[data-color]');
    if (color) {
      setColor(color.dataset.color);
      return;
    }

    const size = event.target.closest('[data-size]');
    if (size) {
      setSize(size.dataset.size);
      return;
    }

    const qtyButton = event.target.closest('[data-product-qty]');
    if (qtyButton) {
      setQuantity(quantity + Number(qtyButton.dataset.productQty));
      return;
    }

    const thumb = event.target.closest('[data-gallery]');
    if (thumb) {
      const index = Number(thumb.dataset.gallery);
      main.querySelectorAll('[data-gallery]').forEach(button => button.classList.toggle('is-active', button === thumb));
      const image = document.getElementById('gallery-image');
      if (image) image.className = `crop-${index}`;
      const counter = document.getElementById('gallery-counter');
      if (counter) counter.textContent = `0${index} / 03`;
      return;
    }

    if (event.target.closest('#gallery-zoom')) {
      openLightbox(product.image, product.name);
      return;
    }

    if (event.target.closest('#add-to-bag') || event.target.closest('#sticky-add')) {
      add();
      return;
    }

    const trigger = event.target.closest('.accordion__trigger');
    if (trigger) {
      const item = trigger.closest('.accordion__item');
      const panel = item.querySelector('.accordion__panel');
      const open = item.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(open));
      panel.style.maxHeight = open ? `${panel.scrollHeight}px` : '0px';
    }
  });

  const firstPanel = document.querySelector('.accordion__item.is-open .accordion__panel');
  if (firstPanel) firstPanel.style.maxHeight = `${firstPanel.scrollHeight}px`;

  const sticky = document.getElementById('sticky-buy');
  const buyRow = main.querySelector('.buy-row');
  const footer = document.querySelector('.site-footer');
  if (sticky && buyRow) {
    const updateSticky = () => {
      const buyRect = buyRow.getBoundingClientRect();
      const footerTop = footer ? footer.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
      const show = buyRect.bottom < 0 && footerTop > window.innerHeight - 76;
      sticky.classList.toggle('is-visible', show);
    };
    window.addEventListener('scroll', updateSticky, { passive: true });
    window.addEventListener('resize', updateSticky);
    updateSticky();
  }
}

if (product) renderProduct();
else renderNotFound();
