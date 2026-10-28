import { PRODUCTS, CATEGORIES, TESTIMONIALS, getProduct } from './data.js';
import { productCard, initReveal, starRating, icon } from './app.js';

const newArrivals = [
  'column-midi',
  'atelier-coat',
  'bias-slip',
  'cloud-knit',
  'selvedge-jacket',
  'fluid-jumpsuit',
  'moto-jacket',
  'merino-crew'
];

const bestsellers = ['essential-tee', 'everyday-hoodie', 'tailored-blazer', 'ceremony-dress'];

function renderProducts(containerId, ids, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = ids
    .map(getProduct)
    .filter(Boolean)
    .map((product, index) =>
      productCard(product, {
        delay: index * 0.05,
        eager: options.eager && index < 4
      })
    )
    .join('');
}

function renderCategories() {
  const container = document.getElementById('category-grid');
  if (!container) return;
  container.innerHTML = CATEGORIES.map((category, index) => {
    const count = PRODUCTS.filter(product => product.tags.includes(category.id)).length;
    return `
      <a class="category-card" href="shop.html?category=${category.id}" data-reveal style="--delay:${(index * 0.06).toFixed(2)}s">
        <img src="${category.image}" alt="${category.label} collection" loading="lazy" width="900" height="1200">
        <span class="category-card__arrow">${icon('arrowUpRight')}</span>
        <div class="category-card__body">
          <h3>${category.label}</h3>
          <p>${String(count).padStart(2, '0')} pieces · ${category.blurb}</p>
        </div>
      </a>`;
  }).join('');
}

function renderTestimonials() {
  const container = document.getElementById('testimonials');
  if (!container) return;
  container.innerHTML = TESTIMONIALS.map(
    (testimonial, index) => `
      <figure class="testimonial" data-reveal style="--delay:${(index * 0.08).toFixed(2)}s">
        ${starRating()}
        <blockquote>“${testimonial.quote}”</blockquote>
        <figcaption class="testimonial__author">
          ${testimonial.name}
          <span>${testimonial.location} · ${testimonial.piece}</span>
        </figcaption>
      </figure>`
  ).join('');
}

renderProducts('new-arrivals', newArrivals, { eager: true });
renderCategories();
renderProducts('bestsellers', bestsellers);
renderTestimonials();
initReveal();
