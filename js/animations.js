window.addEventListener('DOMContentLoaded', () => {
    const tl = gsap.timeline();
    tl.to("#hero-name", { duration: 1.4, y: 0, filter: "blur(0px)", opacity: 1, ease: "expo.out", delay: 0.5 });
    tl.to(".hero-sub-reveal", { duration: 1, opacity: 1, y: 0, stagger: 0.15, ease: "power4.out" }, "-=0.8");
    
    gsap.registerPlugin(ScrollTrigger);
    
    const navWrapper = document.getElementById('nav-wrapper');
    const branding = document.getElementById('main-branding');
    const isMobile = window.innerWidth < 768;
    
    // Sync nav movement
    gsap.to(navWrapper, {
        scrollTrigger: { 
            trigger: "body", 
            start: "top -100", 
            end: "top -300", 
            scrub: 1.5 
        },
        right: "50%", 
        xPercent: 50, 
        top: isMobile ? "16px" : "24px", 
        scale: isMobile ? 0.9 : 0.95, 
        ease: "expo.inOut"
    });

    // Conditional branding hide: only on mobile
    if (isMobile) {
        gsap.to(branding, {
            scrollTrigger: {
                trigger: "body",
                start: "top -50",
                end: "top -150",
                scrub: true
            },
            opacity: 0,
            pointerEvents: 'none',
            ease: "power2.out"
        });
    }
    
    document.querySelectorAll('.reveal-up').forEach(item => {
        gsap.from(item, {
            scrollTrigger: { trigger: item, start: "top 90%" },
            y: 30, opacity: 0, filter: "blur(10px)", duration: 1, ease: "power3.out"
        });
    });
});