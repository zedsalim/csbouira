import { API_KEYS } from "./apikeys.js";

// Search for files in Google Drive
async function searchFiles() {
  const query = document.getElementById("searchQuery").value;
  const searchButton = document.getElementById("searchButton");
  const spinner = searchButton.querySelector("span");
  const resultsDiv = document.getElementById("search-results");

  if (!query) {
    resultsDiv.innerHTML =
      "<p dir='rtl' class='alert alert-danger mt-2'>أدخل كلمة البحث</p>";
    return;
  }

  resultsDiv.innerHTML = "";

  searchButton.disabled = true;
  spinner.className = "spinner-border spinner-border-sm";

  const response = await fetch(API_KEYS.SEARCH + encodeURIComponent(query));
  const files = await response.json();

  if (files.length === 0) {
    resultsDiv.innerHTML =
      "<p dir='rtl' class='alert alert-warning mt-2' >لم يتم العثور على ملفات بهذا الإسم. يرجى المحاولة بأسماء أو إختصارات مشابهة</p>";
  } else {
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

  searchButton.disabled = false;
  spinner.className = "";
}

// Enter key event listener for search input
var search = document.getElementById("searchQuery");
search.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("searchButton").click();
  }
});
