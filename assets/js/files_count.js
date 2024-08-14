// ----- File Count Badge Inside Grades Cards -----
const localStorageKeys = {
  licence1: "licence1",
  licence2: "licence2",
  licence3: "licence3",
  master1_gsi: "master1_gsi",
  master1_isil: "master1_isil",
  master1_ia: "master1_ia",
  master2_gsi: "master2_gsi",
  master2_isil: "master2_isil",
  master2_ia: "master2_gsi",
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
  "https://script.google.com/macros/s/AKfycbyg6r3JS9A7XOafgX48uVMWU0TKsbrFqQGF4VCUcd3L_Rcax9FIMYcOTiqFn0DyAhjo/exec"
)
  .then((response) => response.json())
  .then((data) => {
    document.getElementById("licence1").textContent = data.Licence1;
    document.getElementById("licence2").textContent = data.Licence2;
    document.getElementById("licence3").textContent = data.Licence3;
    document.getElementById("master1_gsi").textContent = data.Master1_GSI;
    document.getElementById("master1_isil").textContent = data.Master1_ISIL;
    document.getElementById("master1_ia").textContent = data.Master1_IA;
    document.getElementById("master2_gsi").textContent = data.Master2_GSI;
    document.getElementById("master2_isil").textContent = data.Master2_ISIL;
    document.getElementById("master2_ia").textContent = data.Master2_IA;

    localStorage.setItem(localStorageKeys.licence1, data.Licence1);
    localStorage.setItem(localStorageKeys.licence2, data.Licence2);
    localStorage.setItem(localStorageKeys.licence3, data.Licence3);
    localStorage.setItem(localStorageKeys.master1_gsi, data.Master1_GSI);
    localStorage.setItem(localStorageKeys.master1_isil, data.Master1_ISIL);
    localStorage.setItem(localStorageKeys.master1_ia, data.Master1_IA);
    localStorage.setItem(localStorageKeys.master2_gsi, data.Master2_GSI);
    localStorage.setItem(localStorageKeys.master2_isil, data.Master2_ISIL);
    localStorage.setItem(localStorageKeys.master2_ia, data.Master2_IA);
  })
  .catch((error) => console.error("Error:", error));
