// Dynamic list of subdomains fetched from Vercel API
let subdomains = [];
let currentResults = [];

// Check local storage for cached subdomains on startup
const cachedData = localStorage.getItem('builtAtSubdomains');
let hasCachedData = false;
if (cachedData) {
    try {
        subdomains = JSON.parse(cachedData);
        currentResults = [...subdomains];
        hasCachedData = true;
    } catch (e) {
        console.error("Failed to parse cached subdomains");
    }
}

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const shortcutHint = document.getElementById('shortcut-hint');
const subdomainList = document.getElementById('subdomain-list');
const noResults = document.getElementById('no-results');
const loading = document.getElementById('loading');

// Fetch subdomains from API
async function fetchSubdomains() {
    try {
        const response = await fetch('/api/subdomains');
        const data = await response.json();
        if (data.subdomains) {
            // Check if data changed to avoid unnecessary re-renders
            const newDataString = JSON.stringify(data.subdomains);
            if (newDataString !== localStorage.getItem('builtAtSubdomains')) {
                subdomains = data.subdomains;
                localStorage.setItem('builtAtSubdomains', newDataString);
                renderSubdomains(searchInput.value); // Re-render with current search
            } else if (!hasCachedData) {
                // If we didn't have cached data and it fetched for the first time, render it
                renderSubdomains(searchInput.value);
            }
        }
    } catch (e) {
        console.error("Failed to fetch subdomains:", e);
    } finally {
        // Ensure loading is hidden even if fetch fails, as long as we tried
        loading.classList.add('hidden');
    }
}
fetchSubdomains();

// Initial render
function renderSubdomains(filter = '') {
    const query = filter.toLowerCase();

    // Sort logically or just pass through
    currentResults = subdomains.filter(sub => {
        return (
            sub.name.toLowerCase().includes(query) ||
            sub.url.toLowerCase().includes(query)
        );
    });

    // Clear previous items
    subdomainList.innerHTML = '';

    // Hide loading if we have cached data
    if (hasCachedData) {
        loading.classList.add('hidden');
    }

    // Manage clear button vs shortcut hint
    if (query.length > 0) {
        clearSearchBtn.classList.remove('hidden');
        shortcutHint.classList.add('hidden');
    } else {
        clearSearchBtn.classList.add('hidden');
        shortcutHint.classList.remove('hidden');
    }

    if (currentResults.length === 0) {
        subdomainList.classList.add('hidden');
        noResults.classList.remove('hidden');
    } else {
        subdomainList.classList.remove('hidden');
        noResults.classList.add('hidden');

        currentResults.forEach((sub, index) => {
            const li = document.createElement('li');
            li.tabIndex = -1;
            li.className = 'subdomain-item';

            // Subdomain link container
            const a = document.createElement('a');
            a.className = 'subdomain-link';
            a.href = sub.url;

            // Container for number and name on the left
            const leftContainer = document.createElement('div');
            leftContainer.className = 'subdomain-left-container';

            // Render shortcut '1'-'9' for the first 9 results
            if (index < 9) {
                const shortcutSpan = document.createElement('span');
                shortcutSpan.className = 'subdomain-shortcut';
                shortcutSpan.textContent = `${index + 1}`;
                leftContainer.appendChild(shortcutSpan);
            }

            const nameSpan = document.createElement('span');
            nameSpan.className = 'subdomain-name';
            nameSpan.textContent = sub.name;
            leftContainer.appendChild(nameSpan);

            a.appendChild(leftContainer);

            li.appendChild(a);
            subdomainList.appendChild(li);
        });
    }
}

// Ensure the page renders the list on load using whatever data is available
if (hasCachedData) {
    renderSubdomains();
}

// Event listener for the search bar
searchInput.addEventListener('input', (e) => {
    renderSubdomains(e.target.value);
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (currentResults.length > 0) {
            window.location.href = currentResults[0].url;
        }
    }
});

// Clear button logic
clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    renderSubdomains('');
    searchInput.focus();
});

// Keyboard Support
document.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const trigger = isMac ? e.metaKey : e.ctrlKey;

    // Check if the user is pressing Cmd+K or Ctrl+K
    if (trigger && e.key === 'k') {
        e.preventDefault(); // Prevent default browser behavior
        searchInput.focus();
    }

    // Map 1-9 to results directly (without Cmd/Ctrl)
    if (e.key >= '1' && e.key <= '9' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (currentResults[index]) {
            window.location.href = currentResults[index].url;
        }
    }

    // Unfocus on escape
    if (e.key === 'Escape') {
        if (document.activeElement === searchInput && searchInput.value.length > 0) {
            searchInput.value = '';
            renderSubdomains('');
        } else if (document.activeElement === searchInput) {
            searchInput.blur();
        }
    }
});
