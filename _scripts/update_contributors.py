"""
GitHub Contributors and Upload Stats Updater
Updates README.md with contributor and upload statistics
"""

import os
import sys
from typing import Any, Dict, List

import requests


class ContributorStatsUpdater:
    """Fetches contributor stats and updates README.md"""

    def __init__(self, owner: str, repo: str):
        self.owner = owner
        self.repo = repo
        self.github_url = f"https://api.github.com/repos/{owner}/{repo}/contributors"
        self.google_script_url = "https://script.google.com/macros/s/AKfycbycNAltZRkg2zEV7frtfxnWJhB729nIhu0vyfg3yzWWZ9VfrxwdqZgxw56JWBqRCMIMqg/exec"

        if not self.google_script_url:
            print("Error: UPLOADERS environment variable not set")
            sys.exit(1)

    def fetch_github_contributors(self) -> List[Dict[str, Any]]:
        """Fetch contributor data from GitHub API"""
        try:
            response = requests.get(self.github_url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching GitHub data: {e}")
            sys.exit(1)

    def fetch_upload_contributors(self) -> Dict[str, List[str]]:
        """Fetch categorized contributors from Google Script"""
        try:
            response = requests.get(self.google_script_url, timeout=10)
            response.raise_for_status()
            data = response.json()

            # Handle new format with categories (including owner)
            if isinstance(data, dict) and ("coreTeam" in data or "owner" in data):
                return {
                    "owner": data.get("owner", []),
                    "coreTeam": data.get("coreTeam", []),
                    "exCoreTeam": data.get("exCoreTeam", []),
                    "contributors": data.get("contributors", []),
                    "stats": data.get("stats", {}),
                }
            # Backward compatibility: old format
            elif isinstance(data, dict) and "contributors" in data:
                return {
                    "owner": [],
                    "coreTeam": [],
                    "exCoreTeam": [],
                    "contributors": data["contributors"],
                    "stats": {},
                }
            # Legacy format: plain dict
            elif isinstance(data, dict):
                return {
                    "owner": [],
                    "coreTeam": [],
                    "exCoreTeam": [],
                    "contributors": sorted(data.keys()),
                    "stats": {},
                }
            else:
                print("Error: Unexpected response format")
                sys.exit(1)

        except requests.exceptions.RequestException as e:
            print(f"Error fetching upload stats: {e}")
            sys.exit(1)
        except requests.exceptions.JSONDecodeError:
            print("Error: Invalid JSON response from upload stats endpoint")
            print(f"Response: {response.text[:200]}")
            sys.exit(1)

    def generate_github_html(self, contributors: List[Dict[str, Any]]) -> str:
        """Generate HTML table for GitHub contributors"""
        html_parts = ["<table>", "<tr>"]

        for contributor in contributors:
            name = contributor["login"]
            commits = contributor["contributions"]
            avatar_url = contributor["avatar_url"]

            html_parts.append(
                f'<td style="text-align: center; width: 100px;">'
                f'<a href="https://github.com/{self.owner}/{self.repo}/graphs/contributors" target="_blank">'
                f'<img src="{avatar_url}" alt="{name}" style="width: 80px; height: 80px;"/>'
                f"</a><br/>"
                f"<span>{commits} commits</span>"
                f"</td>"
            )

        html_parts.extend(["</tr>", "</table>"])
        return "\n".join(html_parts)

    def generate_uploads_html(self, data: Dict[str, List[str]]) -> str:
        """Generate HTML for file upload contributors with categories"""
        html_parts = []

        # Owner Section
        if data["owner"]:
            html_parts.append("<h3>💎 Owner</h3>")
            html_parts.append("<ul>")
            for name in data["owner"]:
                html_parts.append(f"<li><strong><em>{name}</em></strong></li>")
            html_parts.append("</ul>")

        # Core Team Section
        if data["coreTeam"]:
            html_parts.append("<h3>🌟 Core Team</h3>")
            html_parts.append("<ul>")
            for name in data["coreTeam"]:
                html_parts.append(f"<li><strong>{name}</strong></li>")
            html_parts.append("</ul>")

        # Ex-Core Team Section
        if data["exCoreTeam"]:
            html_parts.append("<h3>⭐ Ex-Core Team</h3>")
            html_parts.append("<ul>")
            for name in data["exCoreTeam"]:
                html_parts.append(f"<li><em>{name}</em></li>")
            html_parts.append("</ul>")

        # Contributors Section
        if data["contributors"]:
            html_parts.append("<h3>👥 Contributors</h3>")
            html_parts.append("<ul>")
            for name in data["contributors"]:
                html_parts.append(f"<li>{name}</li>")
            html_parts.append("</ul>")

        return "\n".join(html_parts)

    def update_readme_section(
        self, content: str, start_marker: str, end_marker: str, new_html: str
    ) -> str:
        """Update a section in the README between markers"""
        start_idx = content.find(start_marker)
        end_idx = content.find(end_marker)

        if start_idx != -1 and end_idx != -1:
            end_idx += len(end_marker)
            return (
                content[:start_idx]
                + start_marker
                + "\n"
                + new_html
                + "\n"
                + end_marker
                + content[end_idx:]
            )
        else:
            # Append section if markers don't exist
            return content + "\n" + start_marker + "\n" + new_html + "\n" + end_marker

    def update_readme(self):
        """Main method to update README.md with latest stats"""
        # Fetch data
        print("Fetching GitHub contributors...")
        github_data = self.fetch_github_contributors()
        print(f"Found {len(github_data)} GitHub contributors")

        print("Fetching upload contributors...")
        upload_data = self.fetch_upload_contributors()
        owner_count = len(upload_data["owner"])
        core_count = len(upload_data["coreTeam"])
        ex_core_count = len(upload_data["exCoreTeam"])
        contrib_count = len(upload_data["contributors"])

        # Build status message
        status_parts = []
        if owner_count > 0:
            status_parts.append(f"{owner_count} owner")
        if core_count > 0:
            status_parts.append(f"{core_count} core team")
        if ex_core_count > 0:
            status_parts.append(f"{ex_core_count} ex-core team")
        if contrib_count > 0:
            status_parts.append(f"{contrib_count} contributors")

        print(f"Found {', '.join(status_parts)}")

        # Generate HTML
        github_html = self.generate_github_html(github_data)
        uploads_html = self.generate_uploads_html(upload_data)

        # Read README.md
        try:
            with open("../README.md", "r", encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            print("Error: README.md not found")
            sys.exit(1)

        # Update sections
        content = self.update_readme_section(
            content,
            "<!-- START GITHUB_CONTRIBUTORS -->",
            "<!-- END GITHUB_CONTRIBUTORS -->",
            github_html,
        )

        content = self.update_readme_section(
            content,
            "<!-- START FILE_UPLOADS -->",
            "<!-- END FILE_UPLOADS -->",
            uploads_html,
        )

        # Write updated README
        with open("../README.md", "w", encoding="utf-8") as f:
            f.write(content)

        print("✓ README.md updated successfully")


def main():
    """Entry point"""
    updater = ContributorStatsUpdater(owner="zedsalim", repo="csbouira")
    updater.update_readme()


if __name__ == "__main__":
    main()
