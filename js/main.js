lucide.createIcons();
let activeNavItem = null;

function copyEmail() {
    const email = "hello@thesumit.tech";
    const textArea = document.createElement("textarea");
    textArea.value = email;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        const box = document.getElementById('message-box');
        box.classList.add('visible');
        setTimeout(() => box.classList.remove('visible'), 2500);
    } catch (err) {}
    document.body.removeChild(textArea);
}

function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) {
        const headerOffset = 100;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
}

function updateTime() {
    const now = new Date();
    const timeText = document.getElementById('current-time-text');
    if (timeText) timeText.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
}

window.addEventListener('DOMContentLoaded', () => {
    setInterval(updateTime, 1000); 
    updateTime();
    setActive(document.querySelector('[data-section="home"]'));
});

function hoverPill(element) {
    const pill = document.getElementById('pill');
    const items = document.querySelectorAll('.nav-item');
    items.forEach(item => item.style.color = "rgba(255, 255, 255, 0.4)");
    element.style.color = "black";
    pill.style.opacity = "1";
    pill.style.width = `${element.offsetWidth}px`;
    pill.style.left = `${element.offsetLeft}px`;
}

function setActive(element) { 
    activeNavItem = element; 
    resetPill(); 
}

function resetPill() {
    const pill = document.getElementById('pill');
    const items = document.querySelectorAll('.nav-item');
    if (activeNavItem) {
        items.forEach(item => item.style.color = "rgba(255, 255, 255, 0.4)");
        activeNavItem.style.color = "black";
        pill.style.opacity = "1";
        pill.style.width = `${activeNavItem.offsetWidth}px`;
        pill.style.left = `${activeNavItem.offsetLeft}px`;
    } else {
        pill.style.opacity = "0";
    }
}
