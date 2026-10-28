import { PRODUCTS, TAG_LABELS } from './data.js';
import { productCard, initReveal, getWishlist, icon, money, showToast } from './app.js';

const ALL_TAGS = Object.keys(TAG_LABELS);
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', 'One Size'];
const MAX_PRICE = 500;
const params = new URLSearchParams(window.location.search);

const state = {
  tags: new Set(
    (params.get('category') || '')
      .split(',')
      .map(value => value.trim())
      .filter(value => ALL_TAGS.includes(value))
  ),
  sizes: new Set((params.get('sizes') || '').split(',').filter(Boolean)),
  colors: new Set((params.get('colors') || '').split(',').filter(Boolean)),
  maxPrice: Math.min(MAX_PRICE, Math.max(50, Number(params.get('max')) || MAX_PRICE)),
  sort: ['featured', 'newest', 'price-asc', 'price-desc', 'name'].includes(params.get('sort')) ? params.get('sort') : 'featured',
  q: params.get('q') || '',
  saved: params.get('saved') === '1'
};

const allSizes = SIZE_ORDER.filter(size => PRODUCTS.some(product => product.sizes.includes(size)));
const colorMap = new Map();
PRODUCTS.forEach(product => {
  product.colors.forEach(color => {
    if (!colorMap.has(color.name)) colorMap.set(color.name, color.hex);
  });
});
state.sizes = new Set([...state.sizes].filter(size => allSizes.includes(size)));
state.colors = new Set([...state.colors].filter(color => colorMap.has(color)));

const escapeHtml = value =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const filtersRoot = document.getElementById('filters-root');
const grid = document.getElementById('shop-grid');
const empty = document.getElementById('shop-empty');
const countLabel = document.getElementById('shop-count');
const chipsRoot = document.getElementById('chip-row');
const activeRoot = document.getElementById('active-filters');
const sortSelect = document.getElementById('shop-sort');
const sidebar = document.getElementById('shop-sidebar');
const filterOverlay = document.getElementById('filter-overlay');
const mobileFilterButton = document.getElementById('mobile-filter-btn');

const originalOrder = new Map(PRODUCTS.map((product, index) => [product.id, index]));

function matches(product) {
  if (state.saved && !getWishlist().includes(product.id)) return false;
  if (state.tags.size && !product.tags.some(tag => state.tags.has(tag))) return false;
  if (state.sizes.size && !product.sizes.some(size => state.sizes.has(size))) return false;
  if (state.colors.size && !product.colors.some(color => state.colors.has(color.name))) return false;
  if (product.price > state.maxPrice) return false;
  if (state.q) {
    const haystack = `${product.name} ${product.description} ${product.tags.join(' ')} ${product.colors.map(color => color.name).join(' ')}`.toLowerCase();
    if (!haystack.includes(state.q.toLowerCase())) return false;
  }
  return true;
}

function sortProducts(products) {
  const sorted = [...products];
  if (state.sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  else if (state.sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  else if (state.sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
  else if (state.sort === 'newest') {
    sorted.sort((a, b) => Number(Boolean(b.new)) - Number(Boolean(a.new)) || originalOrder.get(a.id) - originalOrder.get(b.id));
  } else {
    sorted.sort((a, b) => originalOrder.get(a.id) - originalOrder.get(b.id));
  }
  return sorted;
}

function renderFilters() {
  if (!filtersRoot) return;
  filtersRoot.innerHTML = `
    <div class="filter-group">
      <button class="filter-group__head" type="button" data-filter-toggle aria-expanded="true">
        <h3>Category</h3>${icon('chevron')}
      </button>
      <div class="filter-group__body">
        ${ALL_TAGS.map(tag => {
          const count = PRODUCTS.filter(product => product.tags.includes(tag)).length;
          return `<label class="filter-check">
            <input type="checkbox" data-filter-tag="${tag}" ${state.tags.has(tag) ? 'checked' : ''}>
            <span>${TAG_LABELS[tag]}</span>
            <span class="filter-check__count">${String(count).padStart(2, '0')}</span>
          </label>`;
        }).join('')}
      </div>
    </div>
    <div class="filter-group">
      <button class="filter-group__head" type="button" data-filter-toggle aria-expanded="true">
        <h3>Size</h3>${icon('chevron')}
      </button>
      <div class="filter-group__body">
        <div class="size-filter">
          ${allSizes
            .map(size => `<button class="size-chip${state.sizes.has(size) ? ' is-active' : ''}" type="button" data-filter-size="${size}" aria-pressed="${state.sizes.has(size)}">${size}</button>`)
            .join('')}
        </div>
      </div>
    </div>
    <div class="filter-group">
      <button class="filter-group__head" type="button" data-filter-toggle aria-expanded="true">
        <h3>Colour</h3>${icon('chevron')}
      </button>
      <div class="filter-group__body">
        <div class="color-filter">
          ${Array.from(colorMap.entries())
            .map(
              ([name, hex]) =>
                `<button class="color-dot${state.colors.has(name) ? ' is-active' : ''}" type="button" data-filter-color="${name}" style="background:${hex}" title="${name}" aria-label="${name}" aria-pressed="${state.colors.has(name)}"></button>`
            )
            .join('')}
        </div>
      </div>
    </div>
    <div class="filter-group">
      <button class="filter-group__head" type="button" data-filter-toggle aria-expanded="true">
        <h3>Price</h3>${icon('chevron')}
      </button>
      <div class="filter-group__body">
        <div class="price-filter">
          <div class="price-filter__value"><span>Up to</span><span id="price-value">${state.maxPrice >= MAX_PRICE ? 'Any price' : money(state.maxPrice)}</span></div>
          <input id="price-range" type="range" min="50" max="${MAX_PRICE}" step="10" value="${state.maxPrice}" aria-label="Maximum price">
        </div>
      </div>
    </div>
    <button class="filter-clear" type="button" data-clear-filters>Clear all filters</button>`;
}

function updateFilterUI() {
  if (!filtersRoot) return;
  filtersRoot.querySelectorAll('[data-filter-tag]').forEach(input => {
    input.checked = state.tags.has(input.dataset.filterTag);
  });
  filtersRoot.querySelectorAll('[data-filter-size]').forEach(button => {
    const active = state.sizes.has(button.dataset.filterSize);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  filtersRoot.querySelectorAll('[data-filter-color]').forEach(button => {
    const active = state.colors.has(button.dataset.filterColor);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const priceValue = document.getElementById('price-value');
  if (priceValue) priceValue.textContent = state.maxPrice >= MAX_PRICE ? 'Any price' : money(state.maxPrice);
}

function renderChips() {
  if (!chipsRoot) return;
  chipsRoot.innerHTML = `
    <button class="chip${state.tags.size === 0 ? ' is-active' : ''}" type="button" data-chip="">All</button>
    ${ALL_TAGS.map(
      tag => `<button class="chip${state.tags.has(tag) ? ' is-active' : ''}" type="button" data-chip="${tag}">${TAG_LABELS[tag]}</button>`
    ).join('')}`;
}

function renderActiveFilters() {
  if (!activeRoot) return;
  const pills = [];
  if (state.saved) pills.push(`<span class="filter-pill">Saved pieces<button type="button" data-remove-filter="saved" aria-label="Remove saved filter">${icon('close')}</button></span>`);
  if (state.q) pills.push(`<span class="filter-pill">Search: ${escapeHtml(state.q)}<button type="button" data-remove-filter="q" aria-label="Remove search filter">${icon('close')}</button></span>`);
  state.tags.forEach(tag => {
    pills.push(`<span class="filter-pill">${TAG_LABELS[tag]}<button type="button" data-remove-filter="tag" data-value="${tag}" aria-label="Remove ${TAG_LABELS[tag]} filter">${icon('close')}</button></span>`);
  });
  state.sizes.forEach(size => {
    pills.push(`<span class="filter-pill">Size ${size}<button type="button" data-remove-filter="size" data-value="${size}" aria-label="Remove size ${size} filter">${icon('close')}</button></span>`);
  });
  state.colors.forEach(color => {
    pills.push(`<span class="filter-pill">${color}<button type="button" data-remove-filter="color" data-value="${color}" aria-label="Remove ${color} filter">${icon('close')}</button></span>`);
  });
  if (state.maxPrice < MAX_PRICE) {
    pills.push(`<span class="filter-pill">Under ${money(state.maxPrice)}<button type="button" data-remove-filter="price" aria-label="Remove price filter">${icon('close')}</button></span>`);
  }
  activeRoot.innerHTML = pills.join('');
  activeRoot.hidden = pills.length === 0;
}

function renderGrid() {
  if (!grid) return;
  const filtered = sortProducts(PRODUCTS.filter(matches));
  grid.innerHTML = filtered
    .map((product, index) => productCard(product, { delay: Math.min(index * 0.03, 0.3) }))
    .join('');
  if (countLabel) countLabel.textContent = `${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'}`;
  if (empty) {
    if (filtered.length) {
      empty.hidden = true;
      empty.innerHTML = '';
    } else {
      const savedEmpty = state.saved && getWishlist().length === 0;
      empty.hidden = false;
      empty.innerHTML = savedEmpty
        ? `<h2>Nothing saved yet</h2><p>Tap the heart on a piece you love and it will be waiting for you here.</p><a class="btn btn--primary" href="shop.html">Explore the collection</a>`
        : `<h2>No pieces match just yet</h2><p>Try removing a filter or broadening your search. The right piece is in here somewhere.</p><button class="btn btn--outline" type="button" data-clear-filters>Clear all filters</button>`;
    }
  }
  initReveal(grid);
}

function syncUrl() {
  const next = new URLSearchParams();
  if (state.tags.size) next.set('category', Array.from(state.tags).join(','));
  if (state.sizes.size) next.set('sizes', Array.from(state.sizes).join(','));
  if (state.colors.size) next.set('colors', Array.from(state.colors).join(','));
  if (state.maxPrice < MAX_PRICE) next.set('max', String(state.maxPrice));
  if (state.sort !== 'featured') next.set('sort', state.sort);
  if (state.q) next.set('q', state.q);
  if (state.saved) next.set('saved', '1');
  const query = next.toString();
  window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname);
}

function refresh() {
  updateFilterUI();
  renderChips();
  renderActiveFilters();
  renderGrid();
  syncUrl();
}

function clearFilters() {
  state.tags.clear();
  state.sizes.clear();
  state.colors.clear();
  state.maxPrice = MAX_PRICE;
  state.q = '';
  state.saved = false;
  const priceRange = document.getElementById('price-range');
  if (priceRange) priceRange.value = String(MAX_PRICE);
  refresh();
}

function openFilters() {
  if (!sidebar || !filterOverlay) return;
  sidebar.classList.add('is-open');
  filterOverlay.classList.add('is-open');
  document.body.classList.add('is-locked');
  window.setTimeout(() => sidebar.querySelector('[data-close-filters]')?.focus(), 60);
}

function closeFilters() {
  if (!sidebar || !filterOverlay) return;
  sidebar.classList.remove('is-open');
  filterOverlay.classList.remove('is-open');
  if (!document.querySelector('.drawer.is-open, .modal.is-open, .search-panel.is-open')) {
    document.body.classList.remove('is-locked');
  }
  mobileFilterButton?.focus();
}

function bindFilters() {
  filtersRoot?.addEventListener('change', event => {
    const input = event.target.closest('[data-filter-tag]');
    if (!input) return;
    if (input.checked) state.tags.add(input.dataset.filterTag);
    else state.tags.delete(input.dataset.filterTag);
    refresh();
  });

  filtersRoot?.addEventListener('click', event => {
    const toggle = event.target.closest('[data-filter-toggle]');
    if (toggle) {
      const group = toggle.closest('.filter-group');
      const collapsed = group.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', String(!collapsed));
      return;
    }

    const sizeButton = event.target.closest('[data-filter-size]');
    if (sizeButton) {
      const size = sizeButton.dataset.filterSize;
      if (state.sizes.has(size)) state.sizes.delete(size);
      else state.sizes.add(size);
      refresh();
      return;
    }

    const colorButton = event.target.closest('[data-filter-color]');
    if (colorButton) {
      const color = colorButton.dataset.filterColor;
      if (state.colors.has(color)) state.colors.delete(color);
      else state.colors.add(color);
      refresh();
      return;
    }

    if (event.target.closest('[data-clear-filters]')) clearFilters();
  });

  filtersRoot?.addEventListener('input', event => {
    if (event.target.id !== 'price-range') return;
    state.maxPrice = Number(event.target.value);
    const value = document.getElementById('price-value');
    if (value) value.textContent = state.maxPrice >= MAX_PRICE ? 'Any price' : money(state.maxPrice);
    renderActiveFilters();
    renderGrid();
    syncUrl();
  });

  chipsRoot?.addEventListener('click', event => {
    const chip = event.target.closest('[data-chip]');
    if (!chip) return;
    const tag = chip.dataset.chip;
    if (!tag) state.tags.clear();
    else if (state.tags.size === 1 && state.tags.has(tag)) state.tags.clear();
    else state.tags = new Set([tag]);
    refresh();
  });

  activeRoot?.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-filter]');
    if (!button) return;
    const type = button.dataset.removeFilter;
    const value = button.dataset.value;
    if (type === 'saved') state.saved = false;
    if (type === 'q') state.q = '';
    if (type === 'tag') state.tags.delete(value);
    if (type === 'size') state.sizes.delete(value);
    if (type === 'color') state.colors.delete(value);
    if (type === 'price') state.maxPrice = MAX_PRICE;
    refresh();
  });

  sortSelect?.addEventListener('change', () => {
    state.sort = sortSelect.value;
    renderGrid();
    syncUrl();
  });

  mobileFilterButton?.addEventListener('click', openFilters);
  document.getElementById('filter-close')?.addEventListener('click', closeFilters);
  filterOverlay?.addEventListener('click', closeFilters);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sidebar?.classList.contains('is-open')) closeFilters();
  });

  document.addEventListener('click', event => {
    if (event.target.closest('[data-open-cart], [data-open-menu], [data-open-search]')) {
      if (sidebar?.classList.contains('is-open')) closeFilters();
    }
  });

  document.addEventListener('wishlist:change', () => {
    if (state.saved) renderGrid();
  });

  empty?.addEventListener('click', event => {
    if (event.target.closest('[data-clear-filters]')) clearFilters();
  });
}

renderFilters();
renderChips();
renderActiveFilters();
renderGrid();
bindFilters();
if (sortSelect) sortSelect.value = state.sort;
if (state.saved) showToast('Showing your saved pieces.', { href: 'shop.html', action: 'Shop all' });
