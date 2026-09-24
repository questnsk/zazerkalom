const hero = document.querySelector(".hero");
const choices = document.querySelectorAll(".choice");
const scrollHint = document.querySelector(".scroll-hint");

function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;

    const start = window.scrollY;
    const targetY = target.getBoundingClientRect().top + window.scrollY - 12;
    const distance = targetY - start;
    const duration = Math.min(1700, Math.max(900, Math.abs(distance) * 0.55));
    const startTime = performance.now();

    const easeInOut = (t) => t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function animateScroll(now) {
        const progress = Math.min(1, (now - startTime) / duration);
        window.scrollTo(0, start + distance * easeInOut(progress));
        if (progress < 1) requestAnimationFrame(animateScroll);
    }

    requestAnimationFrame(animateScroll);
}

choices.forEach((choice) => {
    choice.addEventListener("click", () => {
        scrollToSection(choice.dataset.target);
    });
});

scrollHint.addEventListener("click", () => {
    scrollToSection("quest");
});

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
            } else {
                entry.target.classList.remove("is-visible");
            }
        });
    },
    {
        threshold: 0.14,
        rootMargin: "0px 0px -8% 0px"
    }
);

document.querySelectorAll(".reveal").forEach((element) => {
    revealObserver.observe(element);
});

// Небольшой cursor-parallax только на десктопе.
if (window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", (event) => {
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;

        document.querySelectorAll(".orb").forEach((orb, index) => {
            const depth = (index + 1) * 4;
            orb.style.marginLeft = `${x * depth}px`;
            orb.style.marginTop = `${y * depth}px`;
        });
    });

    hero.addEventListener("pointerleave", () => {
        document.querySelectorAll(".orb").forEach((orb) => {
            orb.style.marginLeft = "";
            orb.style.marginTop = "";
        });
    });
}


// ================= SECTION PHOTO SCROLL SYSTEM =================
// Квест: три фотографии идут последовательно друг под другом.
// При прокрутке каждая фотография получает мягкий parallax/scale-эффект.
// Кинотеатр: одна фотография заполняет секцию и получает отдельный parallax.
const questPhotos = Array.from(document.querySelectorAll(".quest-photo-stage .section-photo"));
const cinemaSection = document.querySelector(".cinema-section");
const cinemaPhoto = document.querySelector(".cinema-photo");

// Отдельный observer отвечает только за проявление фотографий.
// Он не меняет существующий parallax/scale-код ниже.
const photoRevealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            entry.target.classList.toggle("is-photo-visible", entry.isIntersecting);
        });
    },
    {
        threshold: [0, 0.08, 0.2, 0.45, 0.7],
        rootMargin: "12% 0px 12% 0px"
    }
);

questPhotos.forEach((photo) => photoRevealObserver.observe(photo));
if (cinemaPhoto) photoRevealObserver.observe(cinemaPhoto);

let photoRaf = 0;

function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
}

function updateSectionPhotos() {
    photoRaf = 0;

    const viewportH = window.innerHeight;
    const viewportCenter = viewportH * 0.5;

    // --- Квест: отдельная анимация каждого вертикального фото ---
    questPhotos.forEach((photo) => {
        const rect = photo.getBoundingClientRect();
        const photoCenter = rect.top + rect.height * 0.5;

        // 0 у края viewport, 1 около центра.
        const distance = Math.abs(photoCenter - viewportCenter);
        const focus = 1 - clamp(distance / (viewportH * 0.82));

        // Мягкое приближение + небольшой вертикальный parallax.
        const shift = clamp(
            (viewportCenter - photoCenter) * 0.045,
            -28,
            28
        );

        const scale = 1.035 + focus * 0.035;
        const saturation = 0.84 + focus * 0.16;
        const contrast = 1.02 + focus * 0.07;

        photo.style.transform =
            `translate3d(0, ${shift.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;

        photo.style.filter =
            `saturate(${saturation.toFixed(3)}) contrast(${contrast.toFixed(3)})`;
    });

    // --- Кинотеатр: мягкий parallax на одной фотографии ---
    if (cinemaSection && cinemaPhoto) {
        const rect = cinemaSection.getBoundingClientRect();
        const progress = clamp(
            (viewportH - rect.top) / (rect.height + viewportH)
        );

        const y = (progress - 0.5) * -4.5;
        const scale = 1.0 + progress * 0.018;

        cinemaPhoto.style.transform =
            `scale(${scale.toFixed(4)}) translate3d(0, ${y.toFixed(2)}%, 0)`;

        cinemaPhoto.style.filter =
            `saturate(${(0.84 + progress * 0.14).toFixed(3)}) contrast(${(1.03 + progress * 0.06).toFixed(3)})`;
    }
}

function requestPhotoUpdate() {
    if (!photoRaf) {
        photoRaf = requestAnimationFrame(updateSectionPhotos);
    }
}

window.addEventListener("scroll", requestPhotoUpdate, { passive: true });
window.addEventListener("resize", requestPhotoUpdate);
window.addEventListener("load", requestPhotoUpdate);

requestPhotoUpdate();

/* =========================================
   WHAT INTERESTS YOU — TEXT WAVE
   ========================================= */

(function () {

    const element = document.querySelector(".interest-wave");

    if (!element) return;


    /* -----------------------------------------
       Разбиваем текст на отдельные буквы
       ----------------------------------------- */

    const text = element.textContent;

    element.textContent = "";

    [...text].forEach((char) => {

        const span = document.createElement("span");

        span.className = "wave-letter";

        // Пробелы сохраняем
        if (char === " ") {
            span.innerHTML = "&nbsp;";
        } else {
            span.textContent = char;
        }

        element.appendChild(span);
    });


    const letters = [...element.querySelectorAll(".wave-letter")];

    let pointerX = 0;
    let pointerY = 0;
    let active = false;


    /* -----------------------------------------
       Настройки эффекта
       ----------------------------------------- */

    const radius = 110;       // радиус волны
    const maxScale = 1.55;    // максимальное увеличение
    const minScale = 0.88;    // размер дальних букв


    /* -----------------------------------------
       Расчёт положения каждой буквы
       ----------------------------------------- */

    function updateWave() {

        if (!active) return;

        letters.forEach((letter) => {

            const rect = letter.getBoundingClientRect();

            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dx = pointerX - centerX;
            const dy = pointerY - centerY;

            const distance = Math.sqrt(
                dx * dx + dy * dy
            );

            if (distance < radius) {

                /*
                 * Чем ближе курсор —
                 * тем больше буква.
                 */

                const power = 1 - distance / radius;

                /*
                 * Кубическая кривая делает
                 * волну более плавной.
                 */

                const influence = Math.pow(power, 2.2);

                const scale =
                    minScale +
                    (maxScale - minScale) * influence;

                const lift = -10 * influence;

                letter.style.transform =
                    `translateY(${lift}px) scale(${scale})`;

            } else {

                letter.style.transform =
                    `translateY(0) scale(1)`;
            }
        });
    }


    /* -----------------------------------------
       Мышь + тач
       ----------------------------------------- */

    function handlePointerMove(event) {

        pointerX = event.clientX;
        pointerY = event.clientY;

        active = true;

        updateWave();
    }


    function resetWave() {

        active = false;

        letters.forEach((letter) => {

            letter.style.transform =
                "translateY(0) scale(1)";

        });
    }


    element.addEventListener(
        "pointermove",
        handlePointerMove,
        { passive: true }
    );


    element.addEventListener(
        "pointerenter",
        handlePointerMove,
        { passive: true }
    );


    element.addEventListener(
        "pointerleave",
        resetWave
    );


    /*
     * На телефоне после ухода пальца
     * возвращаем текст в нормальное состояние.
     */

    element.addEventListener(
        "pointercancel",
        resetWave
    );

})();
/* =========================================
   QUEST PHOTO GALLERY
   ========================================= */

(function () {

    const gallery = document.querySelector(".quest-gallery");

    if (!gallery) return;

    const track = gallery.querySelector(".gallery-track");
    const slides = [...gallery.querySelectorAll(".gallery-slide")];

    const prevButton =
        gallery.querySelector(".gallery-prev");

    const nextButton =
        gallery.querySelector(".gallery-next");

    const currentCounter =
        gallery.querySelector(".gallery-current");

    const totalCounter =
        gallery.querySelector(".gallery-total");


    let currentIndex = 0;


    totalCounter.textContent = slides.length;


    /* -----------------------------------------
       Перейти к фотографии
       ----------------------------------------- */

    function goToSlide(index) {

        currentIndex = Math.max(
            0,
            Math.min(index, slides.length - 1)
        );

        const slideWidth = track.clientWidth;

        track.scrollTo({
            left: slideWidth * currentIndex,
            behavior: "smooth"
        });

        currentCounter.textContent =
            currentIndex + 1;
    }


    /* -----------------------------------------
       Стрелка назад
       ----------------------------------------- */

    prevButton.addEventListener(
        "click",
        function () {

            goToSlide(currentIndex - 1);

        }
    );


    /* -----------------------------------------
       Стрелка вперёд
       ----------------------------------------- */

    nextButton.addEventListener(
        "click",
        function () {

            goToSlide(currentIndex + 1);

        }
    );


    /* -----------------------------------------
       Определяем текущую фотографию
       при свайпе пальцем
       ----------------------------------------- */

    let scrollTimer;

    track.addEventListener(
        "scroll",
        function () {

            clearTimeout(scrollTimer);

            scrollTimer = setTimeout(function () {

                const index =
                    Math.round(
                        track.scrollLeft /
                        track.clientWidth
                    );

                currentIndex = Math.max(
                    0,
                    Math.min(index, slides.length - 1)
                );

                currentCounter.textContent =
                    currentIndex + 1;

            }, 80);

        },
        { passive: true }
    );


    /* -----------------------------------------
       Клавиатура
       ----------------------------------------- */

    gallery.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "ArrowLeft") {
                goToSlide(currentIndex - 1);
            }

            if (event.key === "ArrowRight") {
                goToSlide(currentIndex + 1);
            }

        }
    );

})();
/* =========================================
   CINEMA PHOTO GALLERY
   ========================================= */

(function () {

    const gallery =
        document.querySelector(".cinema-gallery");

    if (!gallery) return;

    const track =
        gallery.querySelector(".cinema-gallery-track");

    const slides =
        [...gallery.querySelectorAll(".cinema-gallery-slide")];

    const prevButton =
        gallery.querySelector(".cinema-gallery-prev");

    const nextButton =
        gallery.querySelector(".cinema-gallery-next");

    const currentCounter =
        gallery.querySelector(".cinema-gallery-current");

    const totalCounter =
        gallery.querySelector(".cinema-gallery-total");


    let currentIndex = 0;

    totalCounter.textContent = slides.length;


    function goToSlide(index) {

        currentIndex = Math.max(
            0,
            Math.min(index, slides.length - 1)
        );

        track.scrollTo({
            left: track.clientWidth * currentIndex,
            behavior: "smooth"
        });

        currentCounter.textContent =
            currentIndex + 1;
    }


    prevButton.addEventListener(
        "click",
        () => goToSlide(currentIndex - 1)
    );


    nextButton.addEventListener(
        "click",
        () => goToSlide(currentIndex + 1)
    );


    let scrollTimer;

    track.addEventListener(
        "scroll",
        function () {

            clearTimeout(scrollTimer);

            scrollTimer = setTimeout(() => {

                const index = Math.round(
                    track.scrollLeft /
                    track.clientWidth
                );

                currentIndex = Math.max(
                    0,
                    Math.min(index, slides.length - 1)
                );

                currentCounter.textContent =
                    currentIndex + 1;

            }, 80);

        },
        { passive: true }
    );

})();