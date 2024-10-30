const toggleDarkMode = () => {
  if (DarkReader.isEnabled()) {
    DarkReader.disable();
    localStorage.setItem("darkMode", "disabled");
    updateButtonIcon("moon");
  } else {
    DarkReader.enable({
      brightness: 100,
      contrast: 90,
      sepia: 10,
      style: "dark",
    });
    localStorage.setItem("darkMode", "enabled");
    updateButtonIcon("light");
  }
};

const updateButtonIcon = (icon) => {
  const btnDarkMode = document.querySelector(".btn-dark-mode");
  btnDarkMode.innerHTML =
    icon === "moon"
      ? '<i class="fa-solid fa-moon"></i>'
      : '<i class="fa-solid fa-lightbulb"></i>';
};

const createDarkModeButton = () => {
  const btnDarkMode = document.createElement("button");
  btnDarkMode.type = "button";
  btnDarkMode.className =
    "btn btn-primary btn-floating btn-lg text-white rounded-5 btn-dark-mode";
  btnDarkMode.innerHTML = '<i class="fa-solid fa-moon"></i>';

  btnDarkMode.addEventListener("click", toggleDarkMode);
  document.body.appendChild(btnDarkMode);
};

const checkDarkMode = () => {
  const darkMode = localStorage.getItem("darkMode");
  if (darkMode === "enabled") {
    DarkReader.enable({
      brightness: 100,
      contrast: 90,
      sepia: 10,
      style: "dark",
    });
    updateButtonIcon("sun");
  } else {
    DarkReader.disable();
    updateButtonIcon("moon");
  }
};

const btnBackToTop = document.getElementById("btn-back-to-top");
window.addEventListener("scroll", () => {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    btnBackToTop.classList.add("show");
  } else {
    btnBackToTop.classList.remove("show");
  }
});

btnBackToTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

createDarkModeButton();
checkDarkMode();
