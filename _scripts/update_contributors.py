"""
GitHub Contributors and Upload Stats Updater
Updates both README.md and index.html with contributor statistics
"""

import re
import sys
from typing import Any, Dict, List

import requests


class ContributorUpdater:
    """Fetches contributor stats and updates README.md and index.html"""

    def __init__(self, owner: str, repo: str):
        self.owner = owner
        self.repo = repo
        self.github_url = f"https://api.github.com/repos/{owner}/{repo}/contributors"
        self.google_script_url = "https://script.google.com/macros/s/AKfycbycNAltZRkg2zEV7frtfxnWJhB729nIhu0vyfg3yzWWZ9VfrxwdqZgxw56JWBqRCMIMqg/exec"

    def fetch_github_contributors(self) -> List[Dict[str, Any]]:
        """Fetch contributor data from GitHub API"""
        try:
            response = requests.get(self.github_url, timeout=10)
            response.raise_for_status()
            all_contributors = response.json()

            contributors = [
                contrib
                for contrib in all_contributors
                if not contrib["login"].lower().endswith("[bot]")
                and "bot" not in contrib["login"].lower()
            ]

            print(
                f"Found {len(all_contributors)} total contributors, {len(contributors)} after filtering bots"
            )
            return contributors

        except requests.exceptions.RequestException as e:
            print(f"Error fetching GitHub data: {e}")
            sys.exit(1)

    def fetch_upload_contributors(self) -> Dict[str, List[str]]:
        """Fetch categorized contributors from Google Script"""
        try:
            response = requests.get(self.google_script_url, timeout=10)
            response.raise_for_status()
            data = response.json()

            if isinstance(data, dict) and ("coreTeam" in data or "owner" in data):
                return {
                    "maintainer": data.get("owner", []),
                    "coreTeam": data.get("coreTeam", []),
                    "exCoreTeam": data.get("exCoreTeam", []),
                    "contributors": data.get("contributors", []),
                    "stats": data.get("stats", {}),
                }
            elif isinstance(data, dict) and "contributors" in data:
                return {
                    "maintainer": [],
                    "coreTeam": [],
                    "exCoreTeam": [],
                    "contributors": data["contributors"],
                    "stats": {},
                }
            elif isinstance(data, dict):
                return {
                    "maintainer": [],
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

    # ========== README.md GENERATORS ==========

    def generate_readme_github_html(self, contributors: List[Dict[str, Any]]) -> str:
        """Generate HTML table for GitHub contributors (for README)"""
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

    def generate_readme_uploads_html(self, data: Dict[str, List[str]]) -> str:
        """Generate HTML for file upload contributors (for README)"""
        html_parts = []

        if data["maintainer"]:
            html_parts.append("<h3>🔧 Maintainer</h3>")
            html_parts.append("<ul>")
            for name in data["maintainer"]:
                html_parts.append(f"<li><strong><em>{name}</em></strong></li>")
            html_parts.append("</ul>")

        if data["coreTeam"]:
            html_parts.append("<h3>🌟 Core Team</h3>")
            html_parts.append("<ul>")
            for name in data["coreTeam"]:
                html_parts.append(f"<li><strong>{name}</strong></li>")
            html_parts.append("</ul>")

        if data["exCoreTeam"]:
            html_parts.append("<h3>⭐ Ex-Core Team</h3>")
            html_parts.append("<ul>")
            for name in data["exCoreTeam"]:
                html_parts.append(f"<li><em>{name}</em></li>")
            html_parts.append("</ul>")

        if data["contributors"]:
            html_parts.append("<h3>👥 Contributors</h3>")
            html_parts.append("<ul>")
            for name in data["contributors"]:
                html_parts.append(f"<li>{name}</li>")
            html_parts.append("</ul>")

        return "\n".join(html_parts)

    # ========== HTML MODAL GENERATOR ==========

    def generate_modal_html(
        self, github_data: List[Dict[str, Any]], upload_data: Dict[str, List[str]]
    ) -> str:
        """Generate the contributors modal matching the current DaisyUI HTML structure"""

        # ── GitHub contributor cards ──────────────────────────────────────────
        github_cards = []
        for contributor in github_data:
            name = contributor["login"]
            commits = contributor["contributions"]
            avatar_url = contributor["avatar_url"]
            profile_url = f"https://github.com/{name}"

            github_cards.append(
                f"""              <div class="card bg-base-200 shadow-sm flex flex-col items-center p-4">
                <a href="{profile_url}" target="_blank" class="group">
                  <img
                    src="{avatar_url}"
                    alt="{name}"
                    width="80"
                    height="80"
                    loading="lazy"
                    class="w-20 h-20 rounded-full border-2 border-primary group-hover:scale-110 transition"
                  />
                </a>
                <h4 class="mt-3 font-semibold">{name}</h4>
                <p class="text-sm text-base-content/60">{commits} commits</p>
                <a
                  href="{profile_url}"
                  target="_blank"
                  class="mt-2 text-primary hover:text-primary/80 text-sm"
                >
                  <i class="fab fa-github"></i> View Profile
                </a>
              </div>"""
            )

        github_cards_html = "\n".join(github_cards)

        # ── Upload contributor sections ───────────────────────────────────────
        upload_sections = []

        if upload_data["maintainer"]:
            items = "\n".join(
                f'                  <li class="flex items-center gap-2">'
                f'<i class="fas fa-wrench text-yellow-500"></i>'
                f'<span class="font-semibold">{name}</span></li>'
                for name in upload_data["maintainer"]
            )
            upload_sections.append(
                f"""              <div class="mb-6">
                <h4 class="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                  <i class="fas fa-wrench"></i> Maintainer
                </h4>
                <ul class="space-y-2">
{items}
                </ul>
              </div>"""
            )

        if upload_data["coreTeam"]:
            items = "\n".join(
                f'                  <li class="flex items-center gap-2">'
                f'<i class="fas fa-star text-primary"></i>'
                f'<span class="font-semibold">{name}</span></li>'
                for name in upload_data["coreTeam"]
            )
            upload_sections.append(
                f"""              <div class="mb-6">
                <h4 class="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                  <i class="fas fa-star"></i> Core Team
                </h4>
                <ul class="space-y-2">
{items}
                </ul>
              </div>"""
            )

        if upload_data["exCoreTeam"]:
            items = "\n".join(
                f'                  <li class="flex items-center gap-2">'
                f'<i class="fas fa-star-half-alt text-base-content/50"></i>'
                f"<span>{name}</span></li>"
                for name in upload_data["exCoreTeam"]
            )
            upload_sections.append(
                f"""              <div class="mb-6">
                <h4 class="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                  <i class="fas fa-star-half-alt"></i> Ex-Core Team
                </h4>
                <ul class="space-y-2">
{items}
                </ul>
              </div>"""
            )

        if upload_data["contributors"]:
            items = "\n".join(
                f'                  <li class="flex items-center gap-2">'
                f'<i class="fas fa-user text-success"></i>{name}</li>'
                for name in upload_data["contributors"]
            )
            upload_sections.append(
                f"""              <div class="mb-6">
                <h4 class="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                  <i class="fas fa-users"></i> Contributors
                </h4>
                <ul class="space-y-2 columns-2">
{items}
                </ul>
              </div>"""
            )

        upload_html = "\n".join(upload_sections)

        # ── Full modal ────────────────────────────────────────────────────────
        return f"""<!-- Contributors Modal -->
    <dialog id="contributorsModal" class="modal p-4">
      <div
        class="modal-box w-full max-w-5xl h-[90vh] flex flex-col p-0 rounded-xl overflow-hidden"
      >
        <div
          class="flex justify-between items-center p-4 border-b border-base-300"
        >
          <h3 class="text-xl font-semibold flex items-center gap-2">
            <i class="fas fa-trophy text-red-500"></i>
            Our Amazing Contributors
          </h3>
          <button
            onclick="closeContributorsModal()"
            class="btn btn-ghost btn-circle btn-sm"
          >
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-6 overflow-auto flex-1">
          <div role="tablist" class="tabs tabs-bordered tabs-lg mb-6">
            <button
              id="githubTab"
              role="tab"
              onclick="switchContributorTab('github')"
              class="tab contributor-tab tab-active"
            >
              <i class="fab fa-github mr-2"></i> Code Contributors
            </button>
            <button
              id="uploadsTab"
              role="tab"
              onclick="switchContributorTab('uploads')"
              class="tab contributor-tab"
            >
              <i class="fas fa-upload mr-2"></i> File Uploaders
            </button>
          </div>

          <!-- GitHub Contributors -->
          <div id="githubContent" class="contributor-panel">
            <p class="mb-6">
              Thank you to all the developers who have contributed code to this
              project! 💻
            </p>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
{github_cards_html}
            </div>
            <div class="mt-6 text-center">
              <a
                href="https://github.com/{self.owner}/{self.repo}/graphs/contributors"
                target="_blank"
                class="btn btn-primary rounded-xl"
              >
                <i class="fab fa-github"></i> View All on GitHub
              </a>
            </div>
          </div>

          <!-- File Uploaders Tab -->
          <div id="uploadsContent" class="contributor-panel hidden">
            <p class="mb-6">
              Special thanks to everyone who has uploaded educational materials!
              📚
            </p>
            <div class="max-w-3xl mx-auto">
{upload_html}
            </div>
          </div>
        </div>
      </div>
    </dialog>"""

    # ========== FILE UPDATERS ==========

    def update_section(
        self, content: str, start_marker: str, end_marker: str, new_html: str
    ) -> str:
        """Update a section between markers"""
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
            return content + "\n" + start_marker + "\n" + new_html + "\n" + end_marker

    def update_readme(
        self, github_data: List[Dict[str, Any]], upload_data: Dict[str, List[str]]
    ):
        """Update README.md with latest stats"""
        print("\n📄 Updating README.md...")

        github_html = self.generate_readme_github_html(github_data)
        uploads_html = self.generate_readme_uploads_html(upload_data)

        try:
            with open("README.md", "r", encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            print("⚠️  README.md not found, skipping...")
            return

        content = self.update_section(
            content,
            "<!-- START GITHUB_CONTRIBUTORS -->",
            "<!-- END GITHUB_CONTRIBUTORS -->",
            github_html,
        )
        content = self.update_section(
            content,
            "<!-- START FILE_UPLOADS -->",
            "<!-- END FILE_UPLOADS -->",
            uploads_html,
        )

        with open("README.md", "w", encoding="utf-8") as f:
            f.write(content)

        print("✓ README.md updated successfully")

    def update_html_file(
        self,
        github_data: List[Dict[str, Any]],
        upload_data: Dict[str, List[str]],
    ):
        """Update index.html directly between the Contributors Modal markers"""
        html_file = "index.html"
        print(f"\n🌐 Updating {html_file}...")

        modal_html = self.generate_modal_html(github_data, upload_data)

        try:
            with open(html_file, "r", encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            print(f"⚠️  {html_file} not found, skipping...")
            return

        start_marker = "<!-- Contributors Modal Start -->"
        end_marker = "<!-- Contributors Modal End -->"

        pattern = re.escape(start_marker) + r".*?" + re.escape(end_marker)
        replacement = f"{start_marker}\n    {modal_html}\n    {end_marker}"

        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, replacement, content, flags=re.DOTALL)
            print(f"✓ {html_file} updated successfully")
        else:
            print(f"⚠️  Markers not found in {html_file}. Make sure it contains:")
            print(f"    {start_marker}")
            print(f"    {end_marker}")
            return

        with open(html_file, "w", encoding="utf-8") as f:
            f.write(content)


def main():
    """Entry point"""
    print("=" * 60)
    print("    Contributors Updater (README + index.html)")
    print("=" * 60)

    updater = ContributorUpdater(owner="zedsalim", repo="csbouira")

    print("\n📊 Fetching contributor data...")
    print("Fetching GitHub contributors...")
    github_data = updater.fetch_github_contributors()
    print(f"✓ Found {len(github_data)} GitHub contributors")

    print("Fetching upload contributors...")
    upload_data = updater.fetch_upload_contributors()

    status_parts = []
    if len(upload_data["maintainer"]) > 0:
        status_parts.append(f"{len(upload_data['maintainer'])} maintainer")
    if len(upload_data["coreTeam"]) > 0:
        status_parts.append(f"{len(upload_data['coreTeam'])} core team")
    if len(upload_data["exCoreTeam"]) > 0:
        status_parts.append(f"{len(upload_data['exCoreTeam'])} ex-core team")
    if len(upload_data["contributors"]) > 0:
        status_parts.append(f"{len(upload_data['contributors'])} contributors")
    print(f"✓ Found {', '.join(status_parts)}")

    # Step 1: Update README.md
    updater.update_readme(github_data, upload_data)

    # Step 2: Update index.html directly
    updater.update_html_file(github_data, upload_data)

    print("\n" + "=" * 60)
    print("✨ All done! Files updated:")
    print("   • README.md (contributor sections)")
    print("   • index.html (contributors modal)")
    print("=" * 60)


if __name__ == "__main__":
    main()
