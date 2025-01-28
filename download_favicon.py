import requests
import os

def download_favicon():
    # Créer le dossier static/img s'il n'existe pas
    img_dir = os.path.join('static', 'img')
    os.makedirs(img_dir, exist_ok=True)
    
    # URL du favicon sur Canva
    favicon_url = "https://www.canva.com/design/DAGdgE5-pDE/mqcz3aLP1NUUEzkqTInadA/view"
    
    try:
        # Télécharger le favicon
        response = requests.get(favicon_url)
        response.raise_for_status()
        
        # Sauvegarder le favicon
        favicon_path = os.path.join(img_dir, 'favicon.ico')
        with open(favicon_path, 'wb') as f:
            f.write(response.content)
            
        print(f"Favicon téléchargé avec succès dans {favicon_path}")
        
    except Exception as e:
        print(f"Erreur lors du téléchargement du favicon: {str(e)}")

if __name__ == "__main__":
    download_favicon()
