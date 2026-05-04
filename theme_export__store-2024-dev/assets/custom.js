
function insertSpan(divId, spanClass, spanText) {
  const div = document.getElementById(divId);
  const span = document.createElement('span');
  span.className = spanClass;
  span.textContent = spanText;
  div.appendChild(span);
}

// Usage
insertSpan('HeaderMenu-store-locator', 'highlight', 'Offer');





$('.carousel-main').slick({
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    fade: true,
    asNavFor: '.carousel-nav',
     lazyLoad: 'progressive',
      adaptiveHeight: true
  });
  $('.carousel-nav').slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    asNavFor: '.carousel-main',
    arrows: true,
    centerMode: true,
    focusOnSelect: true,
    lazyLoad: 'progressive',
     adaptiveHeight: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll:2
        }
      }
    ]
  });


