
(function ($) {
  "use strict";
  
  //  Main Menu Offcanvas
  $('.primary-menu').find('li a').each(function () {
    if ($(this).next().length > 0) {
      $(this).parent('li').append('<span class="menu-trigger"><i class="fal fa-angle-down"></i></span>');
    }
  });

 

    // expands the dropdown menu on each click
    $('.primary-menu').find('li .menu-trigger').on('click', function (e) {
      e.preventDefault();
      $(this).toggleClass('open').parent('li').children('ul').stop(true, true).slideToggle(350);
      $(this).find("i").toggleClass("fa-angle-up fa-angle-down");
    });

  

  // check browser width in real-time
  function breakpointCheck() {
    var windoWidth = window.innerWidth;

    if (windoWidth <= 991) {
      $('.header-navbar').addClass('mobile-menu');
    } else {
      $('.header-navbar').removeClass('mobile-menu');
    }
  }

  breakpointCheck();
  $(window).on('resize', function () {
    breakpointCheck();
  });


  $('.nav-toggler').on('click', function (e) {
    $('.site-navbar').toggleClass('menu-on');
    e.preventDefault();
  });

  // Close menu on toggler click
  $('.nav-close').on('click', function (e) {
    $('.site-navbar').removeClass('menu-on');
    e.preventDefault();
  });


  // Offcanvas Info menu

  $('.offcanvas-icon').on('click', function (e) {
    $('.offcanvas-info').toggleClass('offcanvas-on');
    e.preventDefault();
  });

  // Close menu on toggler click
  $('.info-close').on('click', function (e) {
    $('.offcanvas-info').removeClass('offcanvas-on');
    e.preventDefault();
  });



  /* ---------------------------------------------
     Bottom To Top hide
  --------------------------------------------- */

  $(window).scroll(function () {
    var window_top = $(window).scrollTop() + 1;

    if (window_top > 50) {
      $('.fixed-btm-top').addClass('reveal');
    } else {
      $('.fixed-btm-top').removeClass('reveal');
    }
  });

  //  Sticky Menu

$(window).scroll(function () {
    var window_top = $(window).scrollTop() + 1;
    if (window_top > 50) {
      $('.navbar-sticky').addClass('menu_fixed animated fadeInDown');
    } else {
      $('.navbar-sticky').removeClass('menu_fixed animated fadeInDown');
    }
  });
 
 /*
  * ----------------------------------------------------------------------------------------
  *  SMOTH SCROOL JS
  * ----------------------------------------------------------------------------------------
  */
  
 $('a.smoth-scroll').on('click', function (e) {
  var anchor = $(this);
  $('html, body').stop().animate({
      scrollTop: $(anchor.attr('href')).offset().top - 100
  }, 1000);
  e.preventDefault();
})
  

// Testimonial layout 1
$('.testimonials-slides').owlCarousel({
  loop: true,
  dots:false,
  nav: false,
  margin: 10,
  autoplayHoverPause: true,
  autoplay: true,
  responsiveClass:true,
  responsive: {
      0: {
          items: 1,
          dots:true,
          nav:false
      },
      576: {
          items: 1,
          dots:true,
          nav:false
      },
      768: {
          items: 2,
      },
      1000: {
          items:2,
      },
      1200: {
          items: 3,
      }
  }
});


// Testimonial layout 2
$('.testimonials-slides-2').owlCarousel({
    loop: true,
    dots: true,
    nav:false,
    autoplayHoverPause: true,
    autoplay: true,
    responsiveClass:true,
    responsive: {
        0: {
            items: 1,
        },
        576: {
            items: 1,
        },
        768: {
            items: 1,
        },
        1000: {
            items:2,
        },
        1200: {
            items:2,
        }
    }
});



// Testimonial layout 2
$('.testimonials-slides-3').owlCarousel({
  loop: true,
  dots:true,
  nav: false,
  margin: 10,
  autoplayHoverPause: true,
  autoplay: true,
  responsiveClass:true,
  responsive: {
      0: {
          items: 1,
          dots:true,
          nav:false
      },
      576: {
          items: 1,
          dots:true,
          nav:false
      },
      768: {
          items: 1,
      },
      1000: {
          items:3,
      },
      1200: {
          items: 4,
      }
  }
});


// Testimonial layout 3
$('.testimonials-slides-5').owlCarousel({
  loop: true,
  dots:false,
  nav: false,
  margin: 10,
  autoplayHoverPause: true,
  autoplay: true,
  responsiveClass:true,
  responsive: {
      0: {
          items: 1,
          dots:true,
          nav:false
      },
      576: {
          items: 1,
          dots:true,
          nav:false
      },
      768: {
          items: 1,
      },
      1000: {
          items:1,
      },
      1200: {
          items: 1,
      }
  }
});



	// Counter

	$('.counter').counterUp({
	      delay: 10,
	      time: 1000
	  });


    

// Gallery Screenshot
$('.gallery-screenshot').owlCarousel({
  loop: true,
  dots:true,
  nav: false,
  margin: 10,
  center:true,
  autoplayHoverPause: true,
  autoplay: false,
  // navContainer: '#carousel-arrow',
  navText : ["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"],
  // center: true,
  responsiveClass:true,
  responsive: {
      0: {
          items: 1,
          dots:true,
          nav:false
      },
      576: {
          items: 1,
          dots:true,
          nav:false
      },
      768: {
          items: 1,
      },
      1000: {
          items:5,
      },
      1200: {
          items: 5,
      }
  }
});


//  Lightbox
$('.popup').magnificPopup({
    type: 'image',
    gallery:{
      enabled:true
    },
    removalDelay: 300,
  });



}(jQuery));