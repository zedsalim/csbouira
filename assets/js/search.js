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

  files.forEach((file) => {
    const fileLink = document.createElement("a");
    fileLink.href = file.url;
    fileLink.textContent = file.name;
    fileLink.target = "_blank";

    const listItem = document.createElement("div");
    listItem.appendChild(fileLink);
    resultsDiv.appendChild(listItem);
  });
}
