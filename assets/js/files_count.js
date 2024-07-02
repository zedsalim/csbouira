// ----- File Count Badge Inside Grades Cards -----
const localStorageKeys = {
  licence1: "licence1",
  licence2: "licence2",
  licence3: "licence3",
  master1: "master1",
  master2: "master2",
};

function loadFromCache() {
  Object.keys(localStorageKeys).forEach((key) => {
    const value = localStorage.getItem(localStorageKeys[key]);
    if (value) {
      document.getElementById(key).textContent = value;
    }
  });
}

loadFromCache();

fetch(
  "https://script.google.com/macros/s/AKfycbwrueSpr6LcL75-HFz6PozkJOE1nWNetrX6nAipnuMLupOfB33pdah5AF1NLNns6-mz/exec"
)
  .then((response) => response.json())
  .then((data) => {
    document.getElementById("licence1").textContent = data.Licence1;
    document.getElementById("licence2").textContent = data.Licence2;
    document.getElementById("licence3").textContent = data.Licence3;
    document.getElementById("master1").textContent = data.Master1;
    document.getElementById("master2").textContent = data.Master2;

    localStorage.setItem(localStorageKeys.licence1, data.Licence1);
    localStorage.setItem(localStorageKeys.licence2, data.Licence2);
    localStorage.setItem(localStorageKeys.licence3, data.Licence3);
    localStorage.setItem(localStorageKeys.master1, data.Master1);
    localStorage.setItem(localStorageKeys.master2, data.Master2);
  })
  .catch((error) => console.error("Error:", error));
