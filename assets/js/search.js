async function searchFiles() {
  const query = document.getElementById("searchQuery").value;
  const response = await fetch(
    "https://script.google.com/macros/s/AKfycbxTTPqNVHnV42xwWZw2z5IBnJj5WAVuM71Jm_4kmfxNAaXI6ntJJ4PcmqqiJl6tuvvHqg/exec?query=" +
      encodeURIComponent(query),
  );
  const files = await response.json();

  const resultsDiv = document.getElementById("search-results");
  resultsDiv.innerHTML = "";

  if (files.length === 0) {
    resultsDiv.innerHTML = "<p>No files found.</p>";
    return;
  }

  const list = document.createElement("ul");
  list.className = "list-group mt-3";
  files.forEach((file) => {
    const listItem = document.createElement("li");
    listItem.className =
      "fs-5 list-group-item d-flex justify-content-between align-items-center";

    const fileLinkContainer = document.createElement("div");
    fileLinkContainer.className = "custom-link-container";

    const fileLink = document.createElement("a");
    fileLink.href = file.url;
    fileLink.textContent = file.name;
    fileLink.target = "_blank";
    fileLink.className = "text-primary custom-link";

    const icon = document.createElement("i");
    icon.className = "h3 bi bi-file-earmark-text-fill me-2";
    fileLink.insertBefore(icon, fileLink.firstChild);

    fileLinkContainer.appendChild(fileLink);
    listItem.appendChild(fileLinkContainer);
    list.appendChild(listItem);
  });
  resultsDiv.appendChild(list);
}
