async function updateFileCounts() {
  const response = await fetch("total_user_file_counts.json");

  if (response.ok) {
    const data = await response.json();

    for (const [user, count] of Object.entries(data)) {
      const userIdElement = document.getElementById(user);
      if (userIdElement) {
        userIdElement.textContent = count;
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", updateFileCounts);
