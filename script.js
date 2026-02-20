// Dynamic list of subdomains fetched from Vercel API
let subdomains = [];
let currentResults = [];

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const shortcutHint = document.getElementById('shortcut-hint');
const subdomainList = document.getElementById('subdomain-list');
const noResults = document.getElementById('no-results');
const loading = document.getElementById('loading');

// Fetch subdomains on load
async function fetchSubdomains() {
    try {
        const response = await fetch('/api/subdomains');
        const data = await response.json();
        if (data.subdomains) {
            subdomains = data.subdomains;
            renderSubdomains(); // re-render once loaded
        }
    } catch (e) {
        console.error("Failed to fetch subdomains:", e);
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

    // Hide loading
    loading.classList.add('hidden');

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

            const a = document.createElement('a');
            a.className = 'subdomain-link';
            a.href = sub.url;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'subdomain-name';
            nameSpan.textContent = sub.name;

            a.appendChild(nameSpan);

            // Render shortcut '1'-'9' for the first 9 results instead of URL
            if (index < 9) {
                const shortcutSpan = document.createElement('span');
                shortcutSpan.className = 'subdomain-shortcut';
                shortcutSpan.textContent = `Cmd ${index + 1}`;

                // Adjust text based on platform
                const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
                if (!isMac) {
                    shortcutSpan.textContent = `Ctrl ${index + 1}`;
                }

                a.appendChild(shortcutSpan);
            }

            li.appendChild(a);
            subdomainList.appendChild(li);
        });
    }
}

// Ensure the page renders the list on load
renderSubdomains();

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

    // Optional: map Cmd/Ctrl + 1-9 to results
    if (trigger && e.key >= '1' && e.key <= '9') {
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
