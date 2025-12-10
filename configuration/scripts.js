const toggleBtn = document.querySelector('#darkMode button');
const body = document.body;

toggleBtn.addEventListener('click', async function (e) {
    const x = e.clientX;
    const y = e.clientY;
    
    const maxDist = Math.max(
        Math.hypot(x, y),
        Math.hypot(window.innerWidth - x, y),
        Math.hypot(x, window.innerHeight - y),
        Math.hypot(window.innerWidth - x, window.innerHeight - y)
    );
    
    // Set CSS custom properties for the animation
    document.documentElement.style.setProperty('--click-x', `${x}px`);
    document.documentElement.style.setProperty('--click-y', `${y}px`);
    document.documentElement.style.setProperty('--max-radius', `${maxDist}px`);
    
    if (document.startViewTransition) {
        // Modern browsers with View Transitions API
        const transition = document.startViewTransition(() => {
            body.classList.toggle('dark-mode');
            toggleBtn.innerText = body.classList.contains('dark-mode') ? "moon" : "sun";
        });
    } else {
        // Fallback for older browsers
        body.classList.toggle('dark-mode');
        toggleBtn.innerText = body.classList.contains('dark-mode') ? "moon" : "sun";
    }
});