const FRAME_COUNT = 113;
const FRAME_URL = (index) => `frames/ezgif-frame-${String(index).padStart(3, "0")}.png`;
const MOBILE_BREAKPOINT = 768;

const canvas = document.getElementById("hero-canvas");
const canvasStage = canvas?.parentElement;
const context = canvas?.getContext("2d", { alpha: true, desynchronized: true });
const loader = document.getElementById("page-loader");
const loaderStatus = document.getElementById("loader-status");
const progressFill = document.getElementById("hero-progress-fill");
const scrollCue = document.getElementById("scroll-cue");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.getElementById("site-nav");

const heroState = {
    frame: 0,
    progress: 0
};

const frames = new Array(FRAME_COUNT);
let resizeRaf = 0;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function interpolate(start, end, progress) {
    return start + ((end - start) * progress);
}

function loadFrame(index) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.src = FRAME_URL(index);
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}

async function preloadFrames(startIndex = 1, onFrameLoad) {
    const workerCount = Math.min(10, Math.max(1, FRAME_COUNT - startIndex + 1));
    let nextIndex = startIndex;
    let loadedCount = frames.filter(Boolean).length;

    const updateLoader = () => {
        if (!loaderStatus) {
            return;
        }

        loaderStatus.textContent = `Loading ${loadedCount} / ${FRAME_COUNT} frames`;
    };

    updateLoader();

    async function worker() {
        while (nextIndex <= FRAME_COUNT) {
            const currentIndex = nextIndex;
            nextIndex += 1;

            if (frames[currentIndex - 1]) {
                continue;
            }

            try {
                const image = await loadFrame(currentIndex);
                frames[currentIndex - 1] = image;
                loadedCount += 1;
                onFrameLoad?.(currentIndex, image);
                updateLoader();
            } catch (error) {
                console.error(`Failed to load frame ${currentIndex}`, error);
            }
        }
    }

    await Promise.all(Array.from({ length: workerCount }, worker));

    if (loaderStatus) {
        loaderStatus.textContent = "All 113 frames loaded";
    }
}

function getBestAvailableFrame(index) {
    if (frames[index]) {
        return frames[index];
    }

    for (let offset = 1; offset < FRAME_COUNT; offset += 1) {
        if (frames[index - offset]) {
            return frames[index - offset];
        }

        if (frames[index + offset]) {
            return frames[index + offset];
        }
    }

    return null;
}

function resizeCanvas() {
    if (!canvas || !canvasStage || !context) {
        return;
    }

    const bounds = canvasStage.getBoundingClientRect();
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2);

    canvas.width = Math.max(1, Math.floor(bounds.width * dpr));
    canvas.height = Math.max(1, Math.floor(bounds.height * dpr));
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    renderFrame();
}

function getRenderTuning() {
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

    return isMobile
        ? {
            startZoom: 0.98,
            endZoom: 0.94,
            offsetY: -0.006,
            driftY: -0.01
        }
        : {
            startZoom: 0.92,
            endZoom: 0.88,
            offsetY: 0.015,
            driftY: -0.006
        };
}

function renderFrame() {
    if (!canvas || !context) {
        return;
    }

    const image = getBestAvailableFrame(Math.round(heroState.frame));

    if (!image || !canvas.width || !canvas.height) {
        return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const tuning = getRenderTuning();
    const zoom = interpolate(tuning.startZoom, tuning.endZoom, heroState.progress);
    const baseScale = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * baseScale * zoom;
    const drawHeight = image.height * baseScale * zoom;
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2 + (height * tuning.offsetY) + (height * tuning.driftY * heroState.progress);

    context.clearRect(0, 0, width, height);

    const ambientGlow = context.createRadialGradient(
        width * 0.5,
        height * 0.4,
        width * 0.04,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.55
    );

    ambientGlow.addColorStop(0, "rgba(198, 163, 111, 0.18)");
    ambientGlow.addColorStop(0.35, "rgba(90, 58, 34, 0.10)");
    ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

    context.fillStyle = ambientGlow;
    context.fillRect(0, 0, width, height);
    context.drawImage(image, x, y, drawWidth, drawHeight);

    context.save();
    context.globalCompositeOperation = "screen";

    const highlight = context.createRadialGradient(
        width * 0.52,
        height * 0.28,
        0,
        width * 0.52,
        height * 0.28,
        Math.max(width, height) * 0.42
    );

    highlight.addColorStop(0, `rgba(255, 232, 190, ${0.13 - heroState.progress * 0.05})`);
    highlight.addColorStop(0.32, `rgba(198, 163, 111, ${0.10 - heroState.progress * 0.04})`);
    highlight.addColorStop(1, "rgba(0, 0, 0, 0)");

    context.fillStyle = highlight;
    context.fillRect(0, 0, width, height);
    context.restore();
}

function hideLoader() {
    document.body.classList.remove("is-loading");

    if (!loader) {
        return;
    }

    loader.classList.add("is-hidden");

    window.setTimeout(() => {
        loader.remove();
    }, 700);
}

function closeMenu() {
    if (!menuToggle || !siteNav) {
        return;
    }

    menuToggle.setAttribute("aria-expanded", "false");
    siteNav.classList.remove("is-open");
    document.body.classList.remove("menu-open");
}

function setupNavigation() {
    if (!menuToggle || !siteNav) {
        return;
    }

    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        siteNav.classList.toggle("is-open", !isOpen);
        document.body.classList.toggle("menu-open", !isOpen);
    });

    siteNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 860) {
            closeMenu();
        }
    });
}

function setupHeroAnimation() {
    if (!window.gsap || !window.ScrollTrigger || !progressFill) {
        renderFrame();
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.timeline({
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.45,
            invalidateOnRefresh: true
        }
    })
        .to(heroState, {
            frame: FRAME_COUNT - 1,
            progress: 1,
            snap: "frame",
            ease: "none",
            duration: 0.5,
            onUpdate: () => {
                progressFill.style.transform = `scaleY(${heroState.progress})`;
                renderFrame();
            }
        }, 0)
        .to(".hero-copy", {
            yPercent: -5,
            opacity: 0.96,
            ease: "none"
        }, 0.12)
        .to(".hero-stage", {
            scale: 1.01,
            ease: "none"
        }, 0)
        .to(scrollCue, {
            opacity: 0,
            y: 24,
            ease: "none"
        }, 0.05);

    const updateHeaderState = () => {
        const header = document.getElementById("site-header");
        header?.classList.toggle("is-scrolled", window.scrollY > 12);
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
}

function waitForAnimationLibraries(timeout = 5000) {
    return new Promise((resolve) => {
        const start = Date.now();

        function check() {
            if (window.gsap && window.ScrollTrigger) {
                resolve(true);
                return;
            }

            if (Date.now() - start >= timeout) {
                resolve(false);
                return;
            }

            window.setTimeout(check, 50);
        }

        check();
    });
}

function setupEntranceAnimations() {
    if (!window.gsap) {
        return;
    }

    gsap.set(".testimonial-card:not(.is-active)", { autoAlpha: 0 });
    gsap.set(".testimonial-card.is-active", { autoAlpha: 1 });

    gsap.from(".hero-copy > *", {
        y: 32,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.15
    });

    gsap.from(".hero-stage", {
        scale: 0.965,
        opacity: 0,
        duration: 1.1,
        ease: "power3.out",
        delay: 0.2
    });

    gsap.from(".meta-card", {
        y: 24,
        opacity: 0,
        duration: 0.75,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.45
    });
}

function setupRevealAnimations() {
    if (!window.gsap || !window.ScrollTrigger) {
        return;
    }

    gsap.utils.toArray(".section-intro").forEach((intro) => {
        gsap.from(intro, {
            y: 36,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
                trigger: intro,
                start: "top 82%"
            }
        });
    });

    gsap.utils.toArray(".reveal-card").forEach((card, index) => {
        gsap.from(card, {
            y: 44,
            opacity: 0,
            duration: 0.85,
            ease: "power3.out",
            delay: index * 0.06,
            scrollTrigger: {
                trigger: card,
                start: "top 84%"
            }
        });
    });

    gsap.from(".testimonial-stage", {
        y: 48,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
            trigger: ".testimonials",
            start: "top 78%"
        }
    });

    gsap.from(".cta-panel", {
        y: 54,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
            trigger: ".cta",
            start: "top 78%"
        }
    });
}

function setupFloatingBeans() {
    if (!window.gsap) {
        return;
    }

    gsap.utils.toArray(".floating-bean").forEach((bean, index) => {
        gsap.to(bean, {
            y: gsap.utils.random(-18, 22),
            x: gsap.utils.random(-10, 12),
            rotate: gsap.utils.random(-16, 18),
            duration: gsap.utils.random(4.2, 6.6),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: index * 0.25
        });
    });
}

function setupTestimonialCarousel() {
    const slides = Array.from(document.querySelectorAll(".testimonial-card"));
    const nextButton = document.querySelector("[data-carousel-next]");
    const prevButton = document.querySelector("[data-carousel-prev]");
    const dotsContainer = document.getElementById("carousel-dots");

    if (!slides.length || !dotsContainer) {
        return;
    }

    let currentIndex = 0;
    let autoplayId = 0;

    const dots = slides.map((_, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `carousel-dot${index === 0 ? " is-active" : ""}`;
        button.setAttribute("aria-label", `Show testimonial ${index + 1}`);
        button.addEventListener("click", () => {
            goToSlide(index, true);
        });
        dotsContainer.appendChild(button);
        return button;
    });

    function updateDots(nextIndex) {
        dots.forEach((dot, index) => {
            dot.classList.toggle("is-active", index === nextIndex);
        });
    }

    function goToSlide(nextIndex, userInitiated = false) {
        if (nextIndex === currentIndex) {
            return;
        }

        const currentSlide = slides[currentIndex];
        const nextSlide = slides[nextIndex];

        currentSlide.classList.remove("is-active");
        nextSlide.classList.add("is-active");

        if (window.gsap) {
            gsap.killTweensOf([currentSlide, nextSlide]);

            gsap.set(nextSlide, { autoAlpha: 0, y: 36, scale: 0.985, zIndex: 2 });
            gsap.set(currentSlide, { zIndex: 1 });

            gsap.to(currentSlide, {
                autoAlpha: 0,
                y: -18,
                scale: 0.985,
                duration: 0.45,
                ease: "power2.out"
            });

            gsap.to(nextSlide, {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.65,
                ease: "power3.out"
            });
        }

        currentIndex = nextIndex;
        updateDots(nextIndex);

        if (userInitiated) {
            restartAutoplay();
        }
    }

    function showNext(userInitiated = false) {
        goToSlide((currentIndex + 1) % slides.length, userInitiated);
    }

    function showPrevious(userInitiated = false) {
        goToSlide((currentIndex - 1 + slides.length) % slides.length, userInitiated);
    }

    function restartAutoplay() {
        window.clearInterval(autoplayId);
        autoplayId = window.setInterval(() => {
            showNext(false);
        }, 6000);
    }

    nextButton?.addEventListener("click", () => showNext(true));
    prevButton?.addEventListener("click", () => showPrevious(true));

    const carousel = document.querySelector("[data-carousel]");
    carousel?.addEventListener("mouseenter", () => window.clearInterval(autoplayId));
    carousel?.addEventListener("mouseleave", restartAutoplay);

    restartAutoplay();
}

function handleResize() {
    window.cancelAnimationFrame(resizeRaf);
    resizeRaf = window.requestAnimationFrame(() => {
        resizeCanvas();
        if (window.ScrollTrigger) {
            ScrollTrigger.refresh();
        }
    });
}

async function initializeExperience() {
    setupNavigation();

    try {
        const firstFrame = await loadFrame(1);
        frames[0] = firstFrame;
        if (loaderStatus) {
            loaderStatus.textContent = "Loading 1 / 113 frames";
        }
        resizeCanvas();
        renderFrame();
    } catch (error) {
        if (loaderStatus) {
            loaderStatus.textContent = "Unable to load the opening frame";
        }
        console.error(error);
    }

    await waitForAnimationLibraries();

    hideLoader();
    resizeCanvas();
    setupHeroAnimation();
    setupEntranceAnimations();
    setupRevealAnimations();
    setupFloatingBeans();
    setupTestimonialCarousel();

    preloadFrames(2, (frameIndex) => {
        if (frameIndex === Math.round(heroState.frame) + 1) {
            renderFrame();
        }
    });

    window.addEventListener("resize", handleResize);

    if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
            handleResize();
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        initializeExperience();
    }, { once: true });
} else {
    initializeExperience();
}


