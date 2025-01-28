import requests
import os

# Mapping des codes de devise aux codes de pays
COUNTRY_CODES = {
    'INR': 'in',  # Inde
    'BDT': 'bd',  # Bangladesh
    'PKR': 'pk',  # Pakistan
    'EGP': 'eg',  # Égypte
    'PHP': 'ph',  # Philippines
    'IDR': 'id',  # Indonésie
    'YER': 'ye',  # Yémen
    'JOD': 'jo',  # Jordanie
    'SDG': 'sd',  # Soudan
    'LKR': 'lk',  # Sri Lanka
    'KWD': 'kw',  # Koweït
    'ILS': 'il',  # Israël
    'SYP': 'sy',  # Syrie
    'LBP': 'lb',  # Liban
    'TRY': 'tr',  # Turquie
    'GBP': 'gb',  # Royaume-Uni
    'NPR': 'np',  # Népal
    'ERN': 'er',  # Érythrée
    'EUR': 'eu',  # Union européenne
    'SSP': 'ss',  # Soudan du Sud
    'RUB': 'ru',  # Russie
    'UAH': 'ua'   # Ukraine
}

def download_flag(country_code, currency_code):
    """Télécharge le drapeau d'un pays depuis flagcdn.com"""
    url = f'https://flagcdn.com/w80/{country_code}.png'
    flag_path = f'static/flags/{currency_code.lower()}.png'
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        with open(flag_path, 'wb') as f:
            f.write(response.content)
        print(f'Téléchargé : {flag_path}')
        
    except Exception as e:
        print(f'Erreur lors du téléchargement de {country_code}: {str(e)}')

def main():
    # Crée le dossier flags s'il n'existe pas
    os.makedirs('static/flags', exist_ok=True)
    
    # Télécharge chaque drapeau
    for currency_code, country_code in COUNTRY_CODES.items():
        download_flag(country_code, currency_code)

if __name__ == '__main__':
    main()
