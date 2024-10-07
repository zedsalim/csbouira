import json
import requests
import os

url = os.getenv("DRIVE_HIERARCHY")

response = requests.get(url)

if response.status_code == 200:
    response.encoding = "utf-8"
    data = response.json()
    file_path = "assets/html/drive_hierarchy.json"
    with open(file_path, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=2)

else:
    print(f"Failed to fetch data from the API. Status code: {response.status_code}")
