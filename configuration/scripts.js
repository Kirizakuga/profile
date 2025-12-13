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
    
    document.documentElement.style.setProperty('--click-x', `${x}px`);
    document.documentElement.style.setProperty('--click-y', `${y}px`);
    document.documentElement.style.setProperty('--max-radius', `${maxDist}px`);
    
    if (document.startViewTransition) {
        const transition = document.startViewTransition(() => {
            body.classList.toggle('dark-mode');
            toggleBtn.innerText = body.classList.contains('dark-mode') ? "moon" : "sun";
        });
    } else {
        body.classList.toggle('dark-mode');
        toggleBtn.innerText = body.classList.contains('dark-mode') ? "moon" : "sun";
    }
});

async function fetchWakaTimeStats() {
    const statsContainer = document.getElementById('stats-overflow');
    const statsLines = statsContainer.querySelectorAll('.code-lines li');
    
    try {
        const response = await fetch('/api/wakatime/stats');
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch stats');
        }
        
        const stats = result.data;
        const totalSeconds = stats.total_seconds || 0;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        const topLanguages = stats.languages?.slice(0, 3) || [];
        const topProjects = stats.projects?.slice(0, 2) || [];
        
        let languagesHTML = topLanguages.map(lang => {
            const langHours = Math.floor(lang.total_seconds / 3600);
            const langMinutes = Math.floor((lang.total_seconds % 3600) / 60);
            return `<li>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ name: <span class="string">"${lang.name}"</span>, time: <span class="string">"${langHours}h ${langMinutes}m"</span> }</li>`;
        }).join('\n');
        
        let projectsHTML = topProjects.map(proj => {
            const projHours = Math.floor(proj.total_seconds / 3600);
            const projMinutes = Math.floor((proj.total_seconds % 3600) / 60);
            return `<li>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ name: <span class="string">"${proj.name}"</span>, time: <span class="string">"${projHours}h ${projMinutes}m"</span> }</li>`;
        }).join('\n');
        
        statsContainer.innerHTML = `
            <div class="ide-header">
                <span class="file-name">stats.js</span>
            </div>
            <ol class="code-lines">
                <li><span class="keyword">const</span> <span class="variable">wakatime</span> = {</li>
                <li>&nbsp;&nbsp;&nbsp;&nbsp;period: <span class="string">"Last 7 Days"</span>,</li>
                <li>&nbsp;&nbsp;&nbsp;&nbsp;total_time: <span class="string">"${hours}h ${minutes}m"</span>,</li>
                <li>&nbsp;&nbsp;&nbsp;&nbsp;languages: [</li>
                ${languagesHTML}
                <li>&nbsp;&nbsp;&nbsp;&nbsp;],</li>
                <li>&nbsp;&nbsp;&nbsp;&nbsp;projects: [</li>
                ${projectsHTML}
                <li>&nbsp;&nbsp;&nbsp;&nbsp;]</li>
                <li>};</li>
            </ol>
        `;
    } catch (error) {
        console.error('Error fetching WakaTime stats:', error);
    }
}

let currentMode = 'yearly';

async function fetchGitHubContributions(mode = 'yearly') {
    currentMode = mode;
    const container = document.getElementById('heatmap-container');
    container.innerHTML = '';
    
    try {
        const response = await fetch('/api/github/contributions');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error('Failed to fetch GitHub contributions');
        }

        const contributions = data.contributions || [];
        
        if (mode === 'yearly') {
            renderYearlyHeatmap(contributions, container);
        } else if (mode === 'monthly') {
            renderMonthlyHeatmap(contributions, container);
        } else if (mode === 'weekly') {
            renderWeeklyHeatmap(contributions, container);
        }

    } catch (error) {
        console.error('Error fetching GitHub contributions:', error);
        container.innerHTML = '<p style="color: var(--text-main); padding: 20px;">Error loading heatmap</p>';
    }
}

function renderYearlyHeatmap(contributions, container) {
    const daysData = {};
    const currentYear = new Date().getFullYear();
    
    contributions.forEach(day => {
        const date = new Date(day.date);
        if (date.getFullYear() === currentYear) {
            daysData[day.date] = day.count;
        }
    });
    
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '3px';
    container.style.padding = '20px';
    container.style.justifyContent = 'center';
    container.style.maxHeight = 'none';
    container.style.maxWidth = '100%';
    container.style.width = '100%';
    
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const count = daysData[dateStr] || 0;
        const level = count === 0 ? 0 : Math.min(Math.floor(count / 3) + 1, 4);
        
        const daySquare = document.createElement('div');
        daySquare.className = 'heatmap-square heatmap-year-day';
        daySquare.setAttribute('data-level', level);
        daySquare.title = `${d.toLocaleDateString()}: ${count} contributions`;
        
        container.appendChild(daySquare);
    }
}

function renderMonthlyHeatmap(contributions, container) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const weeksData = {};
    contributions.forEach(day => {
        const date = new Date(day.date);
        if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
            const weekNum = Math.ceil(date.getDate() / 7);
            const weekKey = `${currentYear}-${currentMonth}-W${weekNum}`;
            weeksData[weekKey] = (weeksData[weekKey] || 0) + day.count;
        }
    });
    
    container.style.display = 'flex';
    container.style.gap = '8px';
    container.style.padding = '20px';
    container.style.justifyContent = 'center';
    container.style.flexWrap = 'wrap';
    
    const weeksInMonth = Math.ceil(new Date(currentYear, currentMonth + 1, 0).getDate() / 7);
    for (let i = 1; i <= weeksInMonth; i++) {
        const weekKey = `${currentYear}-${currentMonth}-W${i}`;
        const count = weeksData[weekKey] || 0;
        const level = count === 0 ? 0 : Math.min(Math.floor(count / 10) + 1, 4);
        
        const weekSquare = document.createElement('div');
        weekSquare.className = 'heatmap-square heatmap-week';
        weekSquare.setAttribute('data-level', level);
        weekSquare.title = `Week ${i}: ${count} contributions`;
        weekSquare.textContent = `W${i}`;
        
        container.appendChild(weekSquare);
    }
}

function renderWeeklyHeatmap(contributions, container) {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    const hoursData = {};
    contributions.forEach(day => {
        const date = new Date(day.date);
        if (date >= startOfWeek && date <= endOfWeek) {
            const avgPerHour = Math.ceil(day.count / 24);
            for (let h = 0; h < 24; h++) {
                const hourKey = `${day.date}-H${h}`;
                hoursData[hourKey] = avgPerHour;
            }
        }
    });
    
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(24, 1fr)';
    container.style.gap = '4px';
    container.style.padding = '20px';
    container.style.justifyContent = 'center';
    
    for (let h = 0; h < 24; h++) {
        let maxCount = 0;
        for (let d = 0; d < 7; d++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + d);
            const dateStr = dayDate.toISOString().split('T')[0];
            const hourKey = `${dateStr}-H${h}`;
            maxCount = Math.max(maxCount, hoursData[hourKey] || 0);
        }
        
        const level = maxCount === 0 ? 0 : Math.min(Math.floor(maxCount / 2) + 1, 4);
        
        const hourSquare = document.createElement('div');
        hourSquare.className = 'heatmap-square heatmap-hour';
        hourSquare.setAttribute('data-level', level);
        hourSquare.title = `Hour ${h}:00: ~${maxCount} contributions`;
        hourSquare.textContent = `${h}`;
        
        container.appendChild(hourSquare);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    fetchWakaTimeStats();
    fetchGitHubContributions('yearly');
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            fetchGitHubContributions(e.target.dataset.mode);
        });
    });
    
    setInterval(fetchWakaTimeStats, 300000);
    setInterval(() => fetchGitHubContributions(currentMode), 300000);
});