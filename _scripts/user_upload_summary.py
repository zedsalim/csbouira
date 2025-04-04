import json
import os
import time

import requests

WEB_APP_URL = os.getenv("UPLOADER_FILE_COUNT")

folders = [
    "1ère Année Licence",
    "2ème Année Licence",
    "3ème Année Licence",
    "Master 1 GSI",
    "Master 1 ISIL",
    "Master 1 IA",
    "Master 2 GSI",
    "Master 2 ISIL",
    "Master 2 IA",
]

user_emails = os.getenv("UPLOADER_EMAILS").split(",")
uploaders = [
    "salim.zaidi",
    "dany.yakoubi",
    "gaya.tamdjiat",
    "rayane.bouafia",
    "manel.ghazi",
    "marwa.adjou",
    "aldjia.arar",
    "nacerbey.amel",
    "alouache.lyna",
    "melouk.djouiria",
]

if len(user_emails) != len(uploaders):
    raise ValueError("The number of emails must match the number of uploader names.")

total_file_counts = {name: 0 for name in uploaders}


def run_google_script_for_folder(folder_name, emails):
    params = {
        "folderName": folder_name,
        "userEmails": ",".join(emails),
    }

    response = requests.get(WEB_APP_URL, params=params)

    if response.status_code == 200:
        results = response.json()

        for email, count in results.items():
            if email in user_emails:
                index = user_emails.index(email)
                uploader_name = uploaders[index]
                total_file_counts[uploader_name] += count
    else:
        print(f"Failed for folder: {folder_name}, status: {response.status_code}")


def main():
    for folder in folders:
        run_google_script_for_folder(folder, user_emails)
        time.sleep(2)

    output_dir = "./assets/html"
    output_file_path = os.path.join(output_dir, "total_user_file_counts.json")

    with open(output_file_path, "w") as outfile:
        json.dump(total_file_counts, outfile, indent=2)


if __name__ == "__main__":
    main()
