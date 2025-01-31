// Cache for storing conversion results
let conversionCache = {};

function showResults(currency, rate, converted) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="result-card">
            <div class="currency-info">
                <img src="/static/flags/${currency.toLowerCase()}.png" alt="${currency} flag" class="currency-flag">
                <div>
                    <div class="currency-code">${currency}</div>
                    <div class="rate">1 AED = ${rate} ${currency}</div>
                </div>
            </div>
            <div class="amount">${converted.toFixed(2)}</div>
        </div>
    `;
}

async function performConversion() {
    // Get amount
    const amount = document.getElementById('aedAmount').value;
    if (!amount || amount <= 0) {
        document.getElementById('results').innerHTML = '';
        return;
    }

    // Get selected currency
    const selectedCheckbox = document.querySelector('.currency-button input[type="checkbox"]:checked');
    if (!selectedCheckbox) {
        document.getElementById('results').innerHTML = '';
        return;
    }

    const currency = selectedCheckbox.value;
    const cacheKey = `${amount}_${currency}`;

    // Check cache first
    if (conversionCache[cacheKey]) {
        const cached = conversionCache[cacheKey];
        showResults(currency, cached.rate, cached.converted);
        return;
    }

    try {
        const response = await fetch('/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: parseFloat(amount),
                currencies: [currency]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById('results').innerHTML = `
                <div class="error-message">
                    ${data.error || 'Conversion failed'}
                </div>
            `;
            return;
        }

        const result = data.results[currency];
        if (result) {
            // Cache the result
            conversionCache[cacheKey] = {
                rate: result.rate,
                converted: result.converted
            };
            showResults(currency, result.rate, result.converted);
        }

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = `
            <div class="error-message">
                Failed to connect to the server
            </div>
        `;
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Listen for amount changes
    const amountInput = document.getElementById('aedAmount');
    if (amountInput) {
        amountInput.addEventListener('input', performConversion);
    }

    // Listen for currency selection changes
    document.querySelectorAll('.currency-button input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Uncheck all other checkboxes
            document.querySelectorAll('.currency-button input[type="checkbox"]').forEach(cb => {
                if (cb !== checkbox) {
                    cb.checked = false;
                }
            });
            performConversion();
        });
    });

    // Reset button functionality
    const resetButton = document.getElementById('resetAmount');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            if (amountInput) {
                amountInput.value = '';
                amountInput.focus();
                document.getElementById('results').innerHTML = '';
                conversionCache = {}; // Clear cache
                // Uncheck all currency checkboxes
                document.querySelectorAll('.currency-button input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
            }
        });
    }

    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
    }
});

// PWA Installation
let deferredPrompt;

// iOS detection
function isIOS() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
    || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

function showIOSInstall() {
    const installBanner = document.getElementById('installBanner');
    if (installBanner && isIOS() && !hasUserDismissedInstall()) {
        installBanner.style.display = 'block';
    }
}

function hasUserDismissedInstall() {
    return localStorage.getItem('installDismissed') === 'true';
}

function markInstallDismissed() {
    localStorage.setItem('installDismissed', 'true');
    const installBanner = document.getElementById('installBanner');
    if (installBanner) {
        installBanner.style.display = 'none';
    }
}

// Installation event handlers
document.addEventListener('DOMContentLoaded', () => {
    // Show install prompt for Android/Desktop
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });

    // Show iOS-specific install banner
    showIOSInstall();

    // Handle install button click
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
            } else if (isIOS()) {
                // Show iOS-specific instructions
                alert('To install this app on iOS: tap the share button below and then "Add to Home Screen"');
            }
        });
    }

    // Handle close button click
    const closeButton = document.getElementById('closeInstallBanner');
    if (closeButton) {
        closeButton.addEventListener('click', markInstallDismissed);
    }
});

function showInstallButton() {
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.style.display = 'block';
    }
}
