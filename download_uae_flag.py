import requests

def download_uae_flag():
    """Télécharge le drapeau des UAE"""
    url = 'https://flagcdn.com/w80/ae.png'
    flag_path = 'static/flags/aed.png'
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        
        with open(flag_path, 'wb') as f:
            f.write(response.content)
        print('Drapeau UAE téléchargé avec succès')
        
    except Exception as e:
        print(f'Erreur lors du téléchargement: {str(e)}')

if __name__ == '__main__':
    download_uae_flag()
