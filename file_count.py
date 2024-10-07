import requests
import time
import os

WEB_APP_URL = os.getenv('WEB_APP_URL')

folders = [
    '1ère Année Licence',
    '2ème Année Licence',
    '3ème Année Licence',
    'Master 1 GSI',
    'Master 1 ISIL',
    'Master 1 IA',
    'Master 2 GSI',
    'Master 2 ISIL',
    'Master 2 IA'
]

def run_google_script_for_folder(folder_name):
    params = {
        'folderName': folder_name
    }
    
    response = requests.get(WEB_APP_URL, params=params)
    
    if response.status_code != 200:
        print(f'Failed for folder: {folder_name}, status: {response.status_code}')

def main():
    for folder in folders:
        run_google_script_for_folder(folder)
        time.sleep(2)

if __name__ == "__main__":
    main()
