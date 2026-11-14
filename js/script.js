// =====================================================
// ⚠️ ССЫЛКА НА ВАШУ ФУНКЦИЮ ИЗ ЯНДЕКС ОБЛАКА
// =====================================================
const API_URL = 'https://functions.yandexcloud.net/d4ekbmtubqi6io2nbcij';

// ⚠️ ВСТАВЬТЕ ВАШУ ССЫЛКУ НА МЕССЕНДЖЕР МАКС
const MAX_LINK = 'https://max.ru/u/f9LHodD0cOLI9vXYVt76gIYuasLwhXK6vzWWwQRZeLZw7CpAM_vcWMfMFR4';


// =====================================================
// 1. ЛАЙТБОКС ДЛЯ ГАЛЕРЕИ
// =====================================================
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox?.querySelector('.lightbox__img');

if (lightbox && lightboxImg) {
  document.querySelectorAll('.gallery__item').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });
}


// =====================================================
// 2. СЛАЙДЕР СРАВНЕНИЯ В HERO (Круглое фото)
// =====================================================
(function initCompare() {
  const compare = document.getElementById('compare');
  const handle  = document.getElementById('compareHandle');
  const blackImg = compare?.querySelector('.compare__img--black');
  if (!compare || !handle || !blackImg) return;

  let pos = 50;

  function setPosition(p) {
    pos = Math.max(0, Math.min(100, p));
    blackImg.style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
    handle.style.left = pos + '%';
    handle.setAttribute('aria-valuenow', String(Math.round(pos)));
  }

  function pointerToPercent(clientX) {
    const rect = compare.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  let dragging = false;

  compare.addEventListener('pointerdown', (e) => {
    dragging = true;
    compare.setPointerCapture(e.pointerId);
    setPosition(pointerToPercent(e.clientX));
  });

  compare.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    setPosition(pointerToPercent(e.clientX));
  });

  const stop = () => { dragging = false; };
  compare.addEventListener('pointerup', stop);
  compare.addEventListener('pointercancel', stop);
  compare.addEventListener('pointerleave', (e) => {
    if (e.buttons === 0) dragging = false;
  });

  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setPosition(pos - 2); }
    if (e.key === 'ArrowRight') { e.preventDefault(); setPosition(pos + 2); }
    if (e.key === 'Home')       { e.preventDefault(); setPosition(0); }
    if (e.key === 'End')        { e.preventDefault(); setPosition(100); }
  });

  setPosition(50);
})();


// =====================================================
// 3. УНИВЕРСАЛЬНЫЙ СЛАЙДЕР ГАЛЕРЕИ (В домах)
// =====================================================
document.querySelectorAll('.slider').forEach((slider) => {
  const track = slider.querySelector('.slider__track');
  const slides = slider.querySelectorAll('.slider__slide');
  const dotsWrap = slider.querySelector('.slider__dots');
  const btnPrev = slider.querySelector('.slider__btn--prev');
  const btnNext = slider.querySelector('.slider__btn--next');

  if (!track || slides.length === 0) return;

  let index = 0;
  const total = slides.length;

  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className = 'slider__dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Фото ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap?.appendChild(dot);
  }
  const dots = slider.querySelectorAll('.slider__dot');

  function render() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  function goTo(i) {
    index = (i + total) % total;
    render();
  }

  btnPrev?.addEventListener('click', () => goTo(index - 1));
  btnNext?.addEventListener('click', () => goTo(index + 1));

  let startX = 0;
  let dragging = false;

  slider.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.slider__btn, .slider__dot')) return;
    dragging = true;
    startX = e.clientX;
    slider.setPointerCapture(e.pointerId);
  });

  slider.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40) {
      dx < 0 ? goTo(index + 1) : goTo(index - 1);
    }
  });

  slider.addEventListener('pointercancel', () => { dragging = false; });

  slider.setAttribute('tabindex', '0');
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
  });

  render();
});


// =====================================================
// 4. АВТОВЫБОР ДОМА ПРИ БРОНИРОВАНИИ
// =====================================================
document.querySelectorAll('[data-house]').forEach(button => {
  button.addEventListener('click', () => {
    const houseType = button.getAttribute('data-house');
    const selectElement = document.querySelector('select[name="house"]');
    if (selectElement) {
      selectElement.value = houseType;
      // Принудительно вызываем обновление календаря для выбранного дома
      if (typeof initCalendar === 'function') {
        initCalendar(); 
      }
    }
  });
});


// =====================================================
// 5. КАЛЕНДАРЬ (FLATPICKR) И ОТПРАВКА ФОРМЫ
// =====================================================
const bookingForm = document.getElementById('bookingForm');
const formNote = document.getElementById('formNote');
const dateInput = document.querySelector('input[name="date"]');
const houseSelect = document.querySelector('select[name="house"]');
const maxLink = document.getElementById('maxLink');

async function fetchOccupiedDates(houseType) {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    
    return (data.occupied || []).filter(item => {
      if (!item.includes(':')) return true;
      const [itemHouse, itemDate] = item.split(':');
      return houseType === 'any' || itemHouse === houseType;
    }).map(item => item.includes(':') ? item.split(':')[1] : item);
    
  } catch (e) {
    console.error("Не удалось загрузить занятые даты", e);
    return [];
  }
}

async function initCalendar() {
  if (!dateInput) return;
  
  if (dateInput._flatpickr) {
    dateInput._flatpickr.destroy();
  }

  const currentHouse = houseSelect ? houseSelect.value : 'any';
  const occupied = await fetchOccupiedDates(currentHouse);

  flatpickr(dateInput, {
    locale: "ru",
    minDate: "today",
    dateFormat: "Y-m-d",
    disable: occupied,
    disableMobile: true,
    altInput: true,
    altFormat: "j F Y",
  });
}

if (houseSelect) {
  houseSelect.addEventListener('change', initCalendar);
}

initCalendar();

if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(bookingForm).entries());

    if (!data.date) {
      formNote.textContent = 'Пожалуйста, выберите дату заезда.';
      formNote.style.color = '#c0392b';
      return;
    }

    formNote.textContent = 'Отправляем…';
    formNote.style.color = '#c9a87c';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();

      if (response.ok && result.success) {
        formNote.textContent = 'Успешно! Дата забронирована. Переходим в чат...';
        formNote.style.color = '#2e7d32';
        
        const houseName = data.house === 'black' ? 'Тёмный дом' : (data.house === 'white' ? 'Белый дом' : 'Любой дом');
        const msg = `Здравствуйте! Я забронировал(а) на сайте дату: ${data.date} (${houseName}).\n${data.message ? 'Комментарий: ' + data.message : ''}`;
        
        if (maxLink) {
          maxLink.href = MAX_LINK + '?text=' + encodeURIComponent(msg);
          setTimeout(() => {
            maxLink.click();
            bookingForm.reset();
            initCalendar(); 
          }, 800);
        } else {
          bookingForm.reset();
          initCalendar();
        }
      } else {
        throw new Error(result.error || 'Ошибка сервера');
      }
    } catch (err) {
      console.error(err);
      formNote.textContent = 'Не удалось отправить. Попробуйте позже.';
      formNote.style.color = '#c0392b';
    }
  });
}


// =====================================================
// 6. МОДАЛЬНОЕ ОКНО ПОЛИТИКИ КОНФИДЕНЦИАЛЬНОСТИ
// =====================================================
const privacyModal = document.getElementById('privacyModal');
const privacyLink = document.getElementById('privacyLink');
const privacyClose = document.querySelector('.modal__close');

if (privacyModal && privacyLink) {
  privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    privacyModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  });

  const closeModal = () => {
    privacyModal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  if (privacyClose) {
    privacyClose.addEventListener('click', closeModal);
  }

  privacyModal.addEventListener('click', (e) => {
    if (e.target === privacyModal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && privacyModal.classList.contains('is-open')) {
      closeModal();
    }
  });
}


// =====================================================
// 7. ПЛАВНОЕ ПОЯВЛЕНИЕ СЕКЦИЙ
// =====================================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.house, .services, .amenities, .reviews, .contact').forEach(sec => {
  sec.style.opacity = '0';
  sec.style.transform = 'translateY(24px)';
  sec.style.transition = 'opacity .7s ease, transform .7s ease';
  observer.observe(sec);
});


// =====================================================
// 8. АНИМАЦИЯ ЗАГОЛОВКА В ШАПКУ ПРИ СКРОЛЛЕ (ИСПРАВЛЕННАЯ)
// =====================================================
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  window.addEventListener("load", () => {
    const heroTitle = document.getElementById("heroTitle");
    const headerLogo = document.getElementById("headerLogo");
    
    if (!heroTitle || !headerLogo) return;

    // Даем браузеру долю секунды на рендер шрифтов, чтобы координаты были точными
    setTimeout(() => {
      // Получаем координаты цели (логотипа в шапке)
      const targetRect = headerLogo.getBoundingClientRect();
      const startRect = heroTitle.getBoundingClientRect();

      // Вычисляем точный сдвиг без лишних прибавлений
      const moveX = targetRect.left - startRect.left;
      const moveY = targetRect.top - startRect.top;
      
      // Коэффициент уменьшения
      const scaleFactor = targetRect.width / startRect.width;

      // Таймлайн анимации
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".hero-split",
          start: "top top", 
          end: "+=300", // Правильная дистанция (было +=00, из-за чего ломалось)
          scrub: 1, 
          onLeave: () => {
            gsap.set(headerLogo, { opacity: 1, pointerEvents: "auto" });
            gsap.set(heroTitle, { opacity: 0 }); // Скрываем призрак
          },
          onEnterBack: () => {
            gsap.set(headerLogo, { opacity: 0, pointerEvents: "none" });
            gsap.set(heroTitle, { opacity: 1 }); // Возвращаем заголовок
          }
        }
      });

      // Анимируем заголовок
      tl.to(heroTitle, {
        x: moveX,
        y: moveY,
        scale: scaleFactor * 0.9, 
        transformOrigin: "top left", // Жестко фиксируем точку, чтобы не было падения
        duration: 1,
        ease: "power2.inOut"
      }, 0);

      // Меняем цвета текста
      tl.to(".hero-split__title-word--light", {
        color: "#141414",
        duration: 0.4
      }, 0);

      tl.to(".hero-split__title-word--dark", {
        color: "#9a7a48",
        duration: 0.4
      }, 0);

      // Плавно убираем другие элементы героя при скролле
      gsap.to(".hero-split__grid, .hero-split__actions", {
        opacity: 0,
        y: -50,
        scrollTrigger: {
          trigger: ".hero-split",
          start: "top top",
          end: "+=200",
          scrub: true
        }
      });
    }, 100);
  });
}
