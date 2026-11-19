import PhotoSwipeLightbox from 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe-lightbox.esm.min.js';
import PhotoSwipe from 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.esm.min.js';

// Initialize one lightbox per gallery so captions and navigation stay scoped
const galleryIds = [
  '#gallery-trazabilid',
  '#gallery-trazabilid-detail',
  '#gallery-admin-clases',
  '#gallery-qrgen',
  '#gallery-leostamales',
];

// Ensure each gallery item has the real image dimensions before PhotoSwipe opens it.
document.querySelectorAll('.pswp-gallery a').forEach(link => {
  const img = link.querySelector('img');
  if (!img) return;

  const setDimensions = () => {
    if (img.naturalWidth && img.naturalHeight) {
      link.dataset.pswpWidth = img.naturalWidth;
      link.dataset.pswpHeight = img.naturalHeight;
    }
  };

  if (img.complete) {
    setDimensions();
  } else {
    img.addEventListener('load', setDimensions);
  }
});

// Inline discrete carousel switching inside the same project frame
document.querySelectorAll('.carousel-controls[data-gallery]').forEach(controls => {
  const gallerySelector = controls.dataset.gallery;
  const gallery = gallerySelector ? document.querySelector(gallerySelector) : null;
  if (!gallery) return;

  const links = Array.from(gallery.querySelectorAll('a'));
  if (links.length <= 1) return;

  const countLabel = controls.querySelector('.carousel-count');
  const prevBtn = controls.querySelector('[data-carousel="prev"]');
  const nextBtn = controls.querySelector('[data-carousel="next"]');
  let activeIndex = 0;

  function showSlide(nextIndex) {
    activeIndex = (nextIndex + links.length) % links.length;
    links.forEach((link, idx) => {
      link.classList.toggle('pswp-hidden', idx !== activeIndex);
    });
    if (countLabel) {
      countLabel.textContent = `${activeIndex + 1} / ${links.length}`;
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => showSlide(activeIndex - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => showSlide(activeIndex + 1));
  }

  showSlide(0);
});

galleryIds.forEach(gallerySelector => {
  if (!document.querySelector(gallerySelector)) return;

  const lightbox = new PhotoSwipeLightbox({
    gallery: gallerySelector,
    children: 'a',
    pswpModule: PhotoSwipe,
    secondaryZoomLevel: 1.5,
    maxZoomLevel: 4,
  });

  lightbox.init();
});
