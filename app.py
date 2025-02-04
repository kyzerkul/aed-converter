from flask import Flask, render_template, jsonify, request, abort, send_file
import requests
import logging
from datetime import datetime
from functools import lru_cache
import time

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# API Configuration
API_KEY = "6b44e56104-035e7f9145-sqsqqu"
API_BASE_URL = "https://api.fastforex.io"  # Third-party exchange rate provider

# Specific currencies with English names
SPECIFIC_CURRENCIES = {
    'INR': 'Indian Rupee',
    'BDT': 'Bangladeshi Taka',
    'PKR': 'Pakistani Rupee',
    'EGP': 'Egyptian Pound',
    'PHP': 'Philippine Peso',
    'USD': 'US Dollar',
    'IDR': 'Indonesian Rupiah',
    'YER': 'Yemeni Rial',
    'JOD': 'Jordanian Dinar',
    'SDG': 'Sudanese Pound',
    'LKR': 'Sri Lankan Rupee',
    'KWD': 'Kuwaiti Dinar',
    'ILS': 'Israeli New Shekel',
    'SYP': 'Syrian Pound',
    'LBP': 'Lebanese Pound',
    'TRY': 'Turkish Lira',
    'GBP': 'British Pound',
    'NPR': 'Nepalese Rupee',
    'ERN': 'Eritrean Nakfa',
    'EUR': 'Euro',
    'SSP': 'South Sudanese Pound',
    'RUB': 'Russian Ruble',
    'UAH': 'Ukrainian Hryvnia'
}

def get_currencies():
    """Fetch available currencies from third-party exchange rate provider"""
    try:
        url = f"{API_BASE_URL}/currencies?api_key={API_KEY}"
        headers = {"accept": "application/json"}
        
        logger.debug("Fetching currencies from third-party exchange rate provider")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        data = response.json()
        all_currencies = data.get('currencies', {})
        
        # Only return the specific currencies we want
        return {code: name for code, name in SPECIFIC_CURRENCIES.items() if code in all_currencies}
        
    except Exception as e:
        logger.error(f"Failed to fetch currencies: {str(e)}")
        return SPECIFIC_CURRENCIES  # Fallback to our specific list if API fails

# Cache for storing conversion results
@lru_cache(maxsize=1000)
def get_cached_conversion(amount, from_currency, to_currency, timestamp):
    """Get cached conversion result"""
    return convert_currency(amount, from_currency, [to_currency])

def convert_currency(amount, from_currency, to_currencies):
    """Convert currency using third-party exchange rate provider"""
    try:
        # Build URL with parameters - only request the currencies we need
        currencies_str = ','.join(to_currencies)
        url = f"{API_BASE_URL}/convert?api_key={API_KEY}&from={from_currency}&to={currencies_str}&amount={amount}"
        
        # Use a shorter timeout
        response = requests.get(url, timeout=1)
        
        # Fast fail if response is not ok
        if not response.ok:
            raise ValueError("API request failed")
        
        data = response.json()
        if not data or 'result' not in data:
            raise ValueError("Invalid API response")
        
        # Process only the currencies we need
        result = {}
        for currency in to_currencies:
            converted = data['result'].get(currency)
            if converted is not None:
                rate = converted / amount
                result[currency] = {
                    'rate': round(rate, 4),
                    'converted': round(converted, 2),
                    'name': SPECIFIC_CURRENCIES.get(currency, currency)
                }
        
        return result
        
    except Exception as e:
        logger.error(f"Conversion failed: {str(e)}")
        raise ValueError("Failed to convert currency")

@app.route('/')
def home():
    now = datetime.now()
    """Render home page with list of available currencies"""
    currencies = get_currencies()
    return render_template('index.html', currencies=currencies, now=now)

@app.route('/convert/<amount>/<from_currency>/<to_currency>')
def direct_convert(amount, from_currency, to_currency):
    """Handle direct conversion requests from search engines"""
    try:
        # Validate currencies
        if from_currency.upper() != 'AED':
            return render_template('error.html', 
                                error='Only AED conversions are supported',
                                currencies=SPECIFIC_CURRENCIES), 400
            
        if to_currency.upper() not in SPECIFIC_CURRENCIES:
            return render_template('error.html', 
                                error='Unsupported target currency',
                                currencies=SPECIFIC_CURRENCIES), 400
            
        # Convert amount
        try:
            amount = float(amount)
            if amount <= 0:
                return render_template('error.html', 
                                    error='Invalid amount',
                                    currencies=SPECIFIC_CURRENCIES), 400
        except ValueError:
            return render_template('error.html', 
                                error='Invalid amount',
                                currencies=SPECIFIC_CURRENCIES), 400
            
        # Perform conversion
        result = convert_currency(amount, from_currency.upper(), [to_currency.upper()])
        
        # Return the conversion page with pre-selected values
        return render_template('index.html', 
                            currencies=SPECIFIC_CURRENCIES,
                            preselected_amount=amount,
                            preselected_currency=to_currency.upper(),
                            direct_result=result)
                            
    except Exception as e:
        logger.error(f"Direct conversion failed: {str(e)}")
        return render_template('error.html', 
                            error='Conversion failed',
                            currencies=SPECIFIC_CURRENCIES), 500

@app.route('/convert', methods=['POST'])
def convert():
    """Handle currency conversion request"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Get and validate amount
        amount = float(data.get('amount', 0))
        if amount <= 0:
            return jsonify({'error': 'Invalid amount'}), 400
            
        # Get and validate currencies
        target_currencies = data.get('currencies', [])
        if not target_currencies:
            return jsonify({'error': 'No currencies selected'}), 400
            
        # Get current hour timestamp for cache
        current_hour = int(time.time() / 3600)
        
        try:
            # Use cached result if available
            result = get_cached_conversion(amount, 'AED', target_currencies[0], current_hour)
            return jsonify({
                'success': True,
                'amount': amount,
                'from': 'AED',
                'results': result
            })
        except ValueError as e:
            return jsonify({'error': str(e)}), 503
            
    except ValueError:
        return jsonify({'error': 'Invalid input data'}), 400
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/sitemap.xml')
def sitemap():
    return send_file('sitemap.xml', mimetype='application/xml')

# How it works route
@app.route('/how-it-works')
def how_it_works():
    return render_template('how-it-works.html')

# Legal routes
@app.route('/privacy-policy')
def privacy_policy():
    currencies = get_currencies()
    return render_template('legal/privacy.html', 
                         currencies=currencies,
                         last_updated="January 28, 2025")

@app.route('/terms')
def terms_of_service():
    currencies = get_currencies()
    return render_template('legal/terms.html',
                         currencies=currencies,
                         last_updated="January 28, 2025")

@app.route('/disclaimer')
def disclaimer():
    currencies = get_currencies()
    return render_template('legal/disclaimer.html',
                         currencies=currencies,
                         last_updated="January 28, 2025")

@app.route('/crypto')
def crypto():
    return render_template('crypto.html')

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('error.html', 
                        error='Page not found',
                        currencies=SPECIFIC_CURRENCIES), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('error.html', 
                        error='Internal server error',
                        currencies=SPECIFIC_CURRENCIES), 500

if __name__ == '__main__':
    # Test API connection on startup
    currencies = get_currencies()
    if not currencies:
        logger.error("Failed to connect to third-party exchange rate provider")
    else:
        logger.info(f"Successfully connected to third-party exchange rate provider. {len(currencies)} currencies available.")
    
    # Only run in debug mode when running locally
    app.run(debug=False)
