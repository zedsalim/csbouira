import requests

owner = "zedsalim"
repo = "csbouira"

github_url = f"https://api.github.com/repos/{owner}/{repo}/contributors"
google_script_url = "https://script.google.com/macros/s/AKfycbwXRLovDns--omO2YTAdoxtPmgH7S5vLzQHxEA4YIKcb4Tygcygk7r9yiv9W008YoP-/exec"

try:
    github_response = requests.get(github_url)
    github_response.raise_for_status()
    github_data = github_response.json()
except requests.exceptions.RequestException as e:
    print(f"Error fetching GitHub data: {e}")
    exit(1)

try:
    google_script_response = requests.get(google_script_url)
    google_script_response.raise_for_status()
    google_script_data = google_script_response.json()
except requests.exceptions.RequestException as e:
    print(f"Error fetching Google Script app data: {e}")
    exit(1)
except requests.exceptions.JSONDecodeError as e:
    print("Error decoding JSON from Google Script app:")
    print(google_script_response.text)  # Print the raw response for debugging
    exit(1)

# Create HTML content for GitHub contributors
github_html = """
<table>
<tr>
"""

team_github_html = ""

total_commits = 0

for contributor in github_data:
    name = contributor["login"]
    commits = contributor["contributions"]
    avatar_url = contributor["avatar_url"]
    total_commits += commits
    github_html += (
        f'<td style="text-align: center; width: 100px;">'
        f'<a href="https://github.com/{owner}/{repo}/graphs/contributors" target="_blank">'
        f'<img src="{avatar_url}" alt="{name}" style="width: 80px; height: 80px;"/>'
        f"</a><br/>"
        f"<span>{commits} commits</span>"
        f"</td>\n"
    )
    team_github_html += (
        f'<div class="px-5 mb-4 mb-md-0">'
        f'<a href="https://github.com/{owner}/{repo}/graphs/contributors" target="_blank" id="custom-link">'
        f'<img src="{avatar_url}" alt="{name} Avatar" class="rounded-circle mb-2" width="100" height="100" />'
        f'<h5>{name}</h5>'
        f'</a>'
        f'<p class="text-muted">{commits} commits</p>'
        f'</div>\n'
    )

github_html += "</tr>\n</table>\n"

# Create HTML content for Google Script app data
script_html = """
<ul>
"""
team_script_html = ""

for name, uploads in google_script_data.items():
    # Capitalize each word in the name
    formatted_name = " ".join(word.capitalize() for word in name.split())
    script_html += f"<li><strong>{formatted_name}</strong>: total files uploaded ({uploads}).</li>\n"
    team_script_html += (
        f'<li class="list-group-item">'
        f'<strong>{formatted_name}</strong>: total files uploaded ({uploads}).'
        f'</li>\n'
    )
script_html += "</ul>\n"

# Read the existing README.md and inject content
try:
    with open("README.md", "r") as readme:
        content = readme.read()
except FileNotFoundError:
    print("README.md not found.")
    exit(1)

# Replace GitHub Contributors section in README.md
start_placeholder_github = "<!-- START GITHUB_CONTRIBUTORS -->"
end_placeholder_github = "<!-- END GITHUB_CONTRIBUTORS -->"
start_idx_github = content.find(start_placeholder_github)
end_idx_github = content.find(end_placeholder_github)

if start_idx_github != -1 and end_idx_github != -1:
    end_idx_github += len(end_placeholder_github)
    content = (
        content[:start_idx_github]
        + start_placeholder_github
        + "\n"
        + github_html
        + "\n"
        + end_placeholder_github
        + content[end_idx_github:]
    )
else:
    content += (
        "\n"
        + start_placeholder_github
        + "\n"
        + github_html
        + "\n"
        + end_placeholder_github
    )

# Replace File Uploads section in README.md
start_placeholder_script = "<!-- START FILE_UPLOADS -->"
end_placeholder_script = "<!-- END FILE_UPLOADS -->"
start_idx_script = content.find(start_placeholder_script)
end_idx_script = content.find(end_placeholder_script)

if start_idx_script != -1 and end_idx_script != -1:
    end_idx_script += len(end_placeholder_script)
    content = (
        content[:start_idx_script]
        + start_placeholder_script
        + "\n"
        + script_html
        + "\n"
        + end_placeholder_script
        + content[end_idx_script:]
    )
else:
    content += (
        "\n"
        + start_placeholder_script
        + "\n"
        + script_html
        + "\n"
        + end_placeholder_script
    )

# Save the updated content to README.md
with open("README.md", "w") as readme:
    readme.write(content)

# Read the existing our-journey.html and inject content
try:
    with open("./assets/html/our-journey.html", "r") as team_file:
        team_content = team_file.read()
except FileNotFoundError:
    print("our-journey.html not found.")
    exit(1)

# Replace GitHub Contributors section in our-journey.html
start_placeholder_team_github = "<!-- HTML START GITHUB_CONTRIBUTORS -->"
end_placeholder_team_github = "<!-- HTML END GITHUB_CONTRIBUTORS -->"
start_idx_team_github = team_content.find(start_placeholder_team_github)
end_idx_team_github = team_content.find(end_placeholder_team_github)

if start_idx_team_github != -1 and end_idx_team_github != -1:
    end_idx_team_github += len(end_placeholder_team_github)
    team_content = (
        team_content[:start_idx_team_github]
        + start_placeholder_team_github
        + "\n"
        + team_github_html
        + "\n"
        + end_placeholder_team_github
        + team_content[end_idx_team_github:]
    )
else:
    team_content += (
        "\n"
        + start_placeholder_team_github
        + "\n"
        + team_github_html
        + "\n"
        + end_placeholder_team_github
    )

# Replace File Uploads section in our-journey.html
start_placeholder_team_script = "<!-- HTML START FILE_UPLOADS -->"
end_placeholder_team_script = "<!-- HTML END FILE_UPLOADS -->"
start_idx_team_script = team_content.find(start_placeholder_team_script)
end_idx_team_script = team_content.find(end_placeholder_team_script)

if start_idx_team_script != -1 and end_idx_team_script != -1:
    end_idx_team_script += len(end_placeholder_team_script)
    team_content = (
        team_content[:start_idx_team_script]
        + start_placeholder_team_script
        + "\n"
        + team_script_html
        + "\n"
        + end_placeholder_team_script
        + team_content[end_idx_team_script:]
    )
else:
    team_content += (
        "\n"
        + start_placeholder_team_script
        + "\n"
        + team_script_html
        + "\n"
        + end_placeholder_team_script
    )

# Save the updated content to our-journey.html
with open("./assets/html/our-journey.html", "w") as team_file:
    team_file.write(team_content)