"""
GitHub Contributors and Upload Stats Updater
Updates both README.md and index.html with contributor statistics
"""

import os
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

            # Handle new format with categories (including maintainer)
            if isinstance(data, dict) and ("coreTeam" in data or "owner" in data):
                return {
                    "maintainer": data.get("owner", []),
                    "coreTeam": data.get("coreTeam", []),
                    "exCoreTeam": data.get("exCoreTeam", []),
                    "contributors": data.get("contributors", []),
                    "stats": data.get("stats", {}),
                }
            # Backward compatibility: old format
            elif isinstance(data, dict) and "contributors" in data:
                return {
                    "maintainer": [],
                    "coreTeam": [],
                    "exCoreTeam": [],
                    "contributors": data["contributors"],
                    "stats": {},
                }
            # Legacy format: plain dict
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

        # Maintainer Section
        if data["maintainer"]:
            html_parts.append("<h3>🔧 Maintainer</h3>")
            html_parts.append("<ul>")
            for name in data["maintainer"]:
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

    # ========== HTML MODAL GENERATORS ==========

    def generate_modal_html(
        self, github_data: List[Dict[str, Any]], upload_data: Dict[str, List[str]]
    ) -> str:
        """Generate complete HTML modal using existing modal structure"""

        # Generate GitHub contributors HTML
        github_cards = []
        for contributor in github_data:
            name = contributor["login"]
            commits = contributor["contributions"]
            avatar_url = contributor["avatar_url"]
            profile_url = f"https://github.com/{name}"

            github_cards.append(
                f"""
            <div class="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-lg transition">
              <a href="{profile_url}" target="_blank" class="group">
                <img 
                  src="{avatar_url}" 
                  alt="{name}" 
                  class="w-20 h-20 rounded-full border-2 border-blue-500 group-hover:scale-110 transition"
                />
              </a>
              <h4 class="mt-3 font-semibold text-gray-900 dark:text-white">{name}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">{commits} commits</p>
              <a 
                href="{profile_url}" 
                target="_blank" 
                class="mt-2 text-blue-500 hover:text-blue-600 text-sm"
              >
                <i class="fab fa-github"></i> View Profile
              </a>
            </div>
            """
            )

        github_html = "\n".join(github_cards)

        # Generate Upload contributors HTML by category
        upload_sections = []

        # Maintainer Section
        if upload_data["maintainer"]:
            maintainer_items = "\n".join(
                [
                    f'              <li class="flex items-center gap-2"><i class="fas fa-wrench text-yellow-500"></i><span class="font-semibold">{name}</span></li>'
                    for name in upload_data["maintainer"]
                ]
            )
            upload_sections.append(
                f"""
            <div class="mb-6">
              <h4 class="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <i class="fas fa-wrench"></i> Maintainer
              </h4>
              <ul class="space-y-2 text-gray-700 dark:text-gray-300">
{maintainer_items}
              </ul>
            </div>
            """
            )

        # Core Team Section
        if upload_data["coreTeam"]:
            core_items = "\n".join(
                [
                    f'              <li class="flex items-center gap-2"><i class="fas fa-star text-blue-500"></i><span class="font-semibold">{name}</span></li>'
                    for name in upload_data["coreTeam"]
                ]
            )
            upload_sections.append(
                f"""
            <div class="mb-6">
              <h4 class="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <i class="fas fa-star"></i> Core Team
              </h4>
              <ul class="space-y-2 text-gray-700 dark:text-gray-300">
{core_items}
              </ul>
            </div>
            """
            )

        # Ex-Core Team Section
        if upload_data["exCoreTeam"]:
            ex_core_items = "\n".join(
                [
                    f'              <li class="flex items-center gap-2"><i class="fas fa-star-half-alt text-gray-500"></i><span>{name}</span></li>'
                    for name in upload_data["exCoreTeam"]
                ]
            )
            upload_sections.append(
                f"""
            <div class="mb-6">
              <h4 class="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <i class="fas fa-star-half-alt"></i> Ex-Core Team
              </h4>
              <ul class="space-y-2 text-gray-700 dark:text-gray-300">
{ex_core_items}
              </ul>
            </div>
            """
            )

        # Contributors Section
        if upload_data["contributors"]:
            contrib_items = "\n".join(
                [
                    f'              <li class="flex items-center gap-2"><i class="fas fa-user text-green-500"></i>{name}</li>'
                    for name in upload_data["contributors"]
                ]
            )
            upload_sections.append(
                f"""
            <div class="mb-6">
              <h4 class="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <i class="fas fa-users"></i> Contributors
              </h4>
              <ul class="space-y-2 text-gray-700 dark:text-gray-300 columns-2">
{contrib_items}
              </ul>
            </div>
            """
            )

        upload_html = "\n".join(upload_sections)

        # Complete modal HTML using existing modal structure
        modal_html = f"""
    <!-- Contributors Modal -->
    <div id="contributorsModal" class="modal" style="display: none;">
      <div class="modal-content max-w-5xl">
        <div
          class="flex justify-between items-center p-4 border-b"
          style="border-color: var(--border-light)"
        >
          <h3 class="text-2xl font-bold flex items-center gap-2">
            <i class="fas fa-trophy text-red-500"></i>
            Our Amazing Contributors
          </h3>
          <button
            onclick="closeContributorsModal()"
            class="text-2xl hover:text-red-500 transition"
            title="Close"
          >
            &times;
          </button>
        </div>

        <div class="p-6 overflow-auto">
          <!-- Tabs -->
          <div class="flex gap-4 mb-6 border-b border-gray-300 dark:border-gray-700">
            <button
              onclick="switchContributorTab('github')"
              id="githubTab"
              class="contributor-tab active px-4 py-2 font-semibold transition"
            >
              <i class="fab fa-github"></i> Code Contributors
            </button>
            <button
              onclick="switchContributorTab('uploads')"
              id="uploadsTab"
              class="contributor-tab px-4 py-2 font-semibold transition"
            >
              <i class="fas fa-upload"></i> File Uploaders
            </button>
          </div>

          <!-- GitHub Contributors Tab -->
          <div id="githubContent" class="tab-content">
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Thank you to all the developers who have contributed code to this project! 💻
            </p>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
{github_html}
            </div>
            <div class="mt-6 text-center">
              <a
                href="https://github.com/{self.owner}/{self.repo}/graphs/contributors"
                target="_blank"
                class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
              >
                <i class="fab fa-github"></i> View All on GitHub
              </a>
            </div>
          </div>

          <!-- Upload Contributors Tab -->
          <div id="uploadsContent" class="tab-content hidden">
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Special thanks to everyone who has uploaded educational materials! 📚
            </p>
            <div class="max-w-3xl mx-auto">
{upload_html}
            </div>
          </div>
        </div>
      </div>
    </div>
    """

        return modal_html

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
            # Append section if markers don't exist
            return content + "\n" + start_marker + "\n" + new_html + "\n" + end_marker

    def update_readme(
        self, github_data: List[Dict[str, Any]], upload_data: Dict[str, List[str]]
    ):
        """Update README.md with latest stats"""
        print("\n📄 Updating README.md...")

        # Generate HTML for README
        github_html = self.generate_readme_github_html(github_data)
        uploads_html = self.generate_readme_uploads_html(upload_data)

        # Read README.md
        try:
            with open("README.md", "r", encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            print("⚠️  README.md not found, skipping...")
            return

        # Update sections
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

        # Write updated README
        with open("README.md", "w", encoding="utf-8") as f:
            f.write(content)

        print("✓ README.md updated successfully")

    def update_html_file(
        self,
        input_file: str,
        output_file: str,
        github_data: List[Dict[str, Any]],
        upload_data: Dict[str, List[str]],
    ):
        """Update the HTML file with the contributors modal"""

        print(f"\n🌐 Updating {input_file} with contributors modal...")

        # Generate modal HTML and script
        modal_html = self.generate_modal_html(github_data, upload_data)

        # Read HTML file
        try:
            with open(input_file, "r", encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            print(f"⚠️  {input_file} not found, skipping...")
            return

        # Replace content between markers
        pattern = r"<!-- Contributors Modal Start -->.*?<!-- Contributors Modal End -->"
        replacement = f"<!-- Contributors Modal Start -->\n{modal_html}\n    <!-- Contributors Modal End -->"

        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, replacement, content, flags=re.DOTALL)
            print("✓ Modal updated successfully")
        else:
            print("⚠️  Modal markers not found, appending modal before </body>")
            content = content.replace("</body>", f"{replacement}\n</body>")

        # Write to output file
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(content)

        print(f"✓ {output_file} updated successfully")

    def create_temp_with_minified_links(self, input_file: str, output_file: str):
        """Create a temporary file with minified asset links"""
        try:
            with open(input_file, "r", encoding="utf-8") as f:
                content = f.read()

            # Replace unminified CSS with minified
            content = content.replace(
                '<link rel="stylesheet" href="assets/css/unminified/styles.css" />',
                '<link rel="stylesheet" href="assets/css/styles.min.css" />',
            )

            # Uncomment minified scripts
            content = re.sub(
                r'<!-- <script src="assets/js/main\.min\.js"></script> -->',
                '<script src="assets/js/main.min.js"></script>',
                content,
            )
            content = re.sub(
                r'<!-- <script src="assets/js/upload\.min\.js"></script> -->',
                '<script src="assets/js/upload.min.js"></script>',
                content,
            )
            content = re.sub(
                r'<!-- <script src="assets/js/favorites\.min\.js"></script> -->',
                '<script src="assets/js/favorites.min.js"></script>',
                content,
            )

            # Comment out unminified scripts if they exist
            content = re.sub(
                r'<script src="assets/js/unminified/main\.js"></script>',
                '<!-- <script src="assets/js/unminified/main.js"></script> -->',
                content,
            )
            content = re.sub(
                r'<script src="assets/js/unminified/upload\.js"></script>',
                '<!-- <script src="assets/js/unminified/upload.js"></script> -->',
                content,
            )
            content = re.sub(
                r'<script src="assets/js/unminified/favorites\.js"></script>',
                '<!-- <script src="assets/js/unminified/favorites.js"></script> -->',
                content,
            )

            with open(output_file, "w", encoding="utf-8") as f:
                f.write(content)

            print(f"✓ Created {output_file} with minified asset links")

        except FileNotFoundError:
            print(f"⚠️  {input_file} not found, skipping...")

    def minify_html(self, input_file: str, output_file: str):
        """Minify HTML file using minify-html library"""
        try:
            import minify_html

            with open(input_file, "r", encoding="utf-8") as f:
                content = f.read()

            # Minify using minify-html library
            minified = minify_html.minify(
                content,
                minify_js=True,
                minify_css=True,
                keep_closing_tags=True,
                remove_processing_instructions=True,
            )

            with open(output_file, "w", encoding="utf-8") as f:
                f.write(minified)

            print(f"✓ Minified HTML saved to {output_file}")

        except ImportError:
            print("⚠️  minify-html library not found")
            print("   Install it with: pip install minify-html")
            sys.exit(1)
        except FileNotFoundError:
            print(f"⚠️  {input_file} not found, skipping...")


def main():
    """Entry point"""
    print("=" * 60)
    print("    Contributors Updater (README + HTML Modal)")
    print("=" * 60)

    updater = ContributorUpdater(owner="zedsalim", repo="csbouira")

    # Fetch data once for both updates
    print("\n📊 Fetching contributor data...")
    print("Fetching GitHub contributors...")
    github_data = updater.fetch_github_contributors()
    print(f"✓ Found {len(github_data)} GitHub contributors")

    print("Fetching upload contributors...")
    upload_data = updater.fetch_upload_contributors()

    # Count contributors
    maintainer_count = len(upload_data["maintainer"])
    core_count = len(upload_data["coreTeam"])
    ex_core_count = len(upload_data["exCoreTeam"])
    contrib_count = len(upload_data["contributors"])

    status_parts = []
    if maintainer_count > 0:
        status_parts.append(f"{maintainer_count} maintainer")
    if core_count > 0:
        status_parts.append(f"{core_count} core team")
    if ex_core_count > 0:
        status_parts.append(f"{ex_core_count} ex-core team")
    if contrib_count > 0:
        status_parts.append(f"{contrib_count} contributors")

    print(f"✓ Found {', '.join(status_parts)}")

    # Step 1: Update README.md
    updater.update_readme(github_data, upload_data)

    # Step 2: Update index.unminified.html with modal
    updater.update_html_file(
        input_file="index.unminified.html",
        output_file="index.unminified.html",
        github_data=github_data,
        upload_data=upload_data,
    )

    # Step 3: Create temporary file with minified links
    print("\n🔄 Creating index.unminified.tmp.html with minified asset links...")
    updater.create_temp_with_minified_links(
        input_file="index.unminified.html", output_file="index.unminified.tmp.html"
    )

    # Step 4: Minify to index.html
    print("\n⚡ Minifying to index.html...")
    updater.minify_html(
        input_file="index.unminified.tmp.html", output_file="index.html"
    )

    # Step 5: Clean up temporary file
    if os.path.exists("index.unminified.tmp.html"):
        os.remove("index.unminified.tmp.html")
        print("✓ Cleaned up temporary file")

    print("\n" + "=" * 60)
    print("✨ All done! Files updated:")
    print("   • README.md (contributor sections)")
    print("   • index.unminified.html (contributors modal)")
    print("   • index.html (minified)")
    print("=" * 60)


if __name__ == "__main__":
    main()
