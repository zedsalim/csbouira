const toggleDarkMode = () => {
  const isEnabled = DarkReader.isEnabled();
  const icon = isEnabled ? "moon" : "sun";
  isEnabled ? DarkReader.disable() : DarkReader.enable({ brightness: 100, contrast: 90, sepia: 10, style: "dark" });
  document.body.classList.toggle("dark-mode-transition", !isEnabled);
  localStorage.setItem("darkMode", isEnabled ? "disabled" : "enabled");
  updateButtonIcon(icon);
};

const updateButtonIcon = (icon) => {
  document.querySelector(".btn-dark-mode").innerHTML = 
      `<i class="fa-solid fa-${icon === "moon" ? "moon" : "lightbulb"}"></i>`;
};

const createDarkModeButton = () => {
  const btnDarkMode = document.createElement("button");
  btnDarkMode.type = "button";
  btnDarkMode.className = "btn btn-primary btn-floating btn-lg text-white rounded-5 btn-dark-mode";
  btnDarkMode.innerHTML = '<i class="fa-solid fa-moon"></i>';
  btnDarkMode.addEventListener("click", toggleDarkMode);
  document.body.appendChild(btnDarkMode);
};

const initializeDarkMode = () => {
  const darkMode = localStorage.getItem("darkMode") === "enabled";
  if (darkMode) {
      DarkReader.enable({ brightness: 100, contrast: 90, sepia: 10, style: "dark" });
      document.body.classList.add("dark-mode-transition");
  }
  updateButtonIcon(darkMode ? "sun" : "moon");
};

const initBackToTopButton = () => {
  const btnBackToTop = document.getElementById("btn-back-to-top");
  window.addEventListener("scroll", () => {
      btnBackToTop.classList.toggle("show", window.scrollY > 20);
  });
  btnBackToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
};

// Initialize components
createDarkModeButton();
initializeDarkMode();
initBackToTopButton();
