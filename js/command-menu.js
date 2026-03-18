let isMenuOpen = false;
let selectedIndex = 0;

function openCommandMenu() {
    const menu = document.getElementById('command-menu');
    isMenuOpen = true;
    selectedIndex = 0;
    menu.style.display = 'block';
    gsap.to(menu, { opacity: 1, duration: 0.25 });
    gsap.fromTo(".cm-box", { scale: 0.96, y: 15, filter: "blur(8px)" }, { scale: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "power2.out" });
    document.body.style.overflow = 'hidden';
    updateSelection();
    setTimeout(() => document.querySelector('.cm-input').focus(), 100);
}

function closeCommandMenu() {
    const menu = document.getElementById('command-menu');
    isMenuOpen = false;
    gsap.to(menu, { opacity: 0, duration: 0.2, onComplete: () => menu.style.display = 'none' });
    document.body.style.overflow = 'auto';
}

function updateSelection() {
    const items = document.querySelectorAll('.cm-item');
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
            item.classList.remove('active');
        }
    });
}

function navigateToSection(id) {
    closeCommandMenu();
    setTimeout(() => scrollToId(id), 300);
}

window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { 
        e.preventDefault(); 
        isMenuOpen ? closeCommandMenu() : openCommandMenu(); 
    }

    if (isMenuOpen) {
        const items = document.querySelectorAll('.cm-item');
        if (e.key === 'Escape') closeCommandMenu();
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % items.length;
            updateSelection();
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            updateSelection();
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if(items[selectedIndex]) items[selectedIndex].click();
        }
    }
});