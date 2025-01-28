// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(message) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="error-message">
            ${message}
        </div>
    `;
}

function showResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    Object.entries(data.results).forEach(([currency, info]) => {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        resultCard.innerHTML = `
            <div class="currency-info">
                <img src="/static/flags/${currency.toLowerCase()}.png" alt="${currency} flag" class="currency-flag">
                <div>
                    <div class="currency-code">${currency}</div>
                    <div class="rate">1 AED = ${info.rate} ${currency}</div>
                </div>
            </div>
            <div class="amount">${info.converted.toFixed(2)}</div>
        `;
        resultsDiv.appendChild(resultCard);
    });
}

async function performConversion() {
    // Get amount
    const amount = document.getElementById('amount').value;
    if (!amount || amount <= 0) {
        document.getElementById('results').innerHTML = '';
        return;
    }

    // Get selected currencies
    const selectedCurrencies = [];
    document.querySelectorAll('.currency-button input[type="checkbox"]:checked').forEach(checkbox => {
        selectedCurrencies.push(checkbox.value);
    });

    if (selectedCurrencies.length === 0) {
        document.getElementById('results').innerHTML = '';
        return;
    }

    try {
        // Show loading state
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<div class="text-center">Converting...</div>';

        // Make API request
        const response = await fetch('/convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                currencies: selectedCurrencies
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Conversion failed');
            return;
        }

        if (data.success) {
            showResults(data);
        } else {
            showError(data.error || 'Conversion failed');
        }

    } catch (error) {
        console.error('Error:', error);
        showError('Failed to connect to the server');
    }
}

// Debounced version of convertCurrency that waits 10ms after the user stops typing
const debouncedConversion = debounce(performConversion, 10);

// Add event listeners for real-time conversion
document.addEventListener('DOMContentLoaded', function() {
    // Listen for amount changes
    const amountInput = document.getElementById('amount');
    amountInput.addEventListener('input', debouncedConversion);

    // Listen for currency selection changes
    document.querySelectorAll('.currency-button input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', debouncedConversion);
    });

    // Reset button functionality
    const resetButton = document.getElementById('resetAmount');
    resetButton.addEventListener('click', function() {
        amountInput.value = '';
        amountInput.focus();
        document.getElementById('results').innerHTML = '';
    });

    // Initial conversion if amount is present and currencies are selected
    if (amountInput.value) {
        debouncedConversion();
    }

    // Mobile Navigation
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileNavToggle && navLinks) {
        mobileNavToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Install PWA
    let deferredPrompt;
    const installBanner = document.getElementById('installBanner');
    const installButton = document.getElementById('installButton');
    const closeInstallBanner = document.getElementById('closeInstallBanner');
    const installMessage = document.querySelector('.install-message span');

    // Detect iOS
    const isIOS = () => {
        return [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
        ].includes(navigator.platform)
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    };

    // Show iOS-specific install instructions
    const showIOSInstall = () => {
        if (isIOS() && !hasUserDismissedInstall()) {
            installMessage.textContent = 'Install AED Convert: tap Share then "Add to Home Screen"';
            installButton.style.display = 'none';
            installBanner.classList.add('show');
        }
    };

    // Check if user has already dismissed or installed
    const hasUserDismissedInstall = () => {
        return localStorage.getItem('dismissedInstall') === 'true';
    };

    const markInstallDismissed = () => {
        localStorage.setItem('dismissedInstall', 'true');
        // Reset after 30 days
        setTimeout(() => {
            localStorage.removeItem('dismissedInstall');
        }, 30 * 24 * 60 * 60 * 1000);
    };

    // Show install prompt for Android/Desktop
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show the install banner if not dismissed
        if (!hasUserDismissedInstall()) {
            installMessage.textContent = 'Install AED Convert for quick access!';
            installButton.style.display = 'block';
            installBanner.classList.add('show');
        }
    });

    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        // Hide the banner
        installBanner.classList.remove('show');
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        
        deferredPrompt = null;
    });

    closeInstallBanner.addEventListener('click', () => {
        installBanner.classList.remove('show');
        markInstallDismissed();
    });

    // Hide banner if app is already installed
    window.addEventListener('appinstalled', () => {
        installBanner.classList.remove('show');
        deferredPrompt = null;
    });

    // Check for iOS when page loads
    showIOSInstall();
});
