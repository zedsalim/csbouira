// ---- Back to top button ----
let mybutton = document.getElementById("btn-back-to-top");
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.classList.add("show");
  } else {
    mybutton.classList.remove("show");
  }
}
mybutton.addEventListener("click", backToTop);

function backToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

function switchLanguage(lang) {
  const script = document.createElement("script");
  script.src = `/assets/js/lang-${lang}.js`;
  document.head.appendChild(script);
  script.onload = () => {
    console.log("Language script loaded:", script.src);
    console.log("Translations:", translations);
    
    if (translations) {
      document.getElementById("welcomeMessage").textContent = translations.welcomeMessage;
      document.getElementById("description").textContent = translations.description;
      document.getElementById("uploadButton").textContent = translations.uploadButton;
      document.getElementById("grades_title").textContent = translations.grades_title;
      document.getElementById("licence").textContent = translations.licence;
      document.getElementById("licence1").textContent = translations.licence1;
      document.getElementById("licence2").textContent = translations.licence2;
      document.getElementById("licence3").textContent = translations.licence3;
      document.getElementById("Master1").textContent = translations.Master1;
      document.getElementById("Master1_isil").textContent = translations.Master1_isil;
      document.getElementById("Master1_gsi").textContent = translations.Master1_gsi;
      document.getElementById("Master1_ia").textContent = translations.Master1_ia;
      document.getElementById("Master2").textContent = translations.Master2;
      document.getElementById("Master2_ia").textContent = translations.Master2_ia;
      document.getElementById("Master2_gsi").textContent = translations.Master2_gsi;
      document.getElementById("Master2_isil").textContent = translations.Master2_isil;
      document.getElementById("gradescard").textContent = translations.gradescard;
      document.getElementById("about_us1").textContent = translations.about_us1;
      document.getElementById("about_us2").textContent = translations.about_us2;
      document.getElementById("Contribute").textContent = translations.Contribute;
      document.getElementById("submit_contact").textContent = translations.submit_contact;
      document.getElementById("clickhere").textContent = translations.clickhere;

    } else {
      console.error("Translations object is not defined.");
    }
  };
  script.onerror = () => {
    console.error("Failed to load language script:", script.src);
  };
}