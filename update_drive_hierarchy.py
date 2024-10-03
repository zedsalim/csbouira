import json

import requests

url = "https://script.google.com/macros/s/AKfycbwGxORruvFeEdalhtt6Mionj6p4COR9Usz8BQ-CueQoZAzz4ayylafH2bsrBsArPlco/exec"
response = requests.get(url)

if response.status_code == 200:
    response.encoding = "utf-8"
    data = response.json()
    file_path = "assets/html/drive_hierarchy.json"
    with open(file_path, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=2)

else:
    print(f"Failed to fetch data from the API. Status code: {response.status_code}")
