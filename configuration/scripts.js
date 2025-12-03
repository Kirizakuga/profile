const toggleBtn = document.querySelector('#darkMode button');
const body = document.body;

toggleBtn.addEventListener('click', function (e) {
    // 1. Get click coordinates relative to the viewport
    const x = e.clientX;
    const y = e.clientY;

    // 2. Create the ripple element
    const ripple = document.createElement('div');
    ripple.classList.add('ripple-circle');

    // 3. Decide color: If we are currently Dark, ripple should be Light (and vice versa)
    const isDark = body.classList.contains('dark-mode');
    
    // HARDCODED COLORS matching the CSS variables for the ripple effect
    // Light Mode Target Color: #d8d2c3
    // Dark Mode Target Color: #323437
    ripple.style.backgroundColor = isDark ? '#d8d2c3' : '#323437';

    // 4. Position and Size the Ripple
    // We make it large enough to cover the screen (max width/height)
    const size = Math.max(window.innerWidth, window.innerHeight) * 2;
    
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;

    document.body.appendChild(ripple);

    // 5. Trigger the Theme Swap halfway through or at end
    setTimeout(() => {
        body.classList.toggle('dark-mode');
        
        // Update button text
        toggleBtn.innerText = body.classList.contains('dark-mode') ? "moon" : "sun";
        
    }, 400); // Swap classes halfway through animation (300ms)

    // 6. Clean up the ripple element after animation finishes
    setTimeout(() => {
        ripple.remove();
    }, 600);
});