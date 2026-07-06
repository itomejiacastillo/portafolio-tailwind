import PhotoSwipeLightbox from 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe-lightbox.esm.min.js';
import PhotoSwipe from 'https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.esm.min.js';

// Initialize one lightbox per gallery so captions and navigation stay scoped
const galleryIds = [
  '#gallery-trazabilid',
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

galleryIds.forEach(gallerySelector => {
  const lightbox = new PhotoSwipeLightbox({
    gallery: gallerySelector,
    children: 'a',
    pswpModule: PhotoSwipe,
    secondaryZoomLevel: 1.5,
    maxZoomLevel: 4,
  });

  lightbox.init();
});
