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
    if (translations) {
      const elements = {
        welcomeMessage: document.getElementById("welcomeMessage"),
        description: document.getElementById("description"),
        uploadButton: document.getElementById("uploadButton"),
        grades_title: document.getElementById("grades_title"),
        licence_title: document.getElementById("licence_title"),
        licence_1: document.getElementById("licence_1"),
        licence_2: document.getElementById("licence_2"),
        licence_3: document.getElementById("licence_3"),
        Master1: document.getElementById("Master1"),
        Master1_isil: document.getElementById("Master1_isil"),
        Master1_gsi: document.getElementById("Master1_gsi"),
        Master1_ia: document.getElementById("Master1_ia"),
        Master2: document.getElementById("Master2"),
        Master2_ia: document.getElementById("Master2_ia"),
        Master2_gsi: document.getElementById("Master2_gsi"),
        Master2_isil: document.getElementById("Master2_isil"),
        gradescard: document.getElementById("gradescard"),
        Contribute: document.getElementById("Contribute"),
        submit_contact: document.getElementById("submit_contact"),
        clickhere: document.getElementById("clickhere"),
        uploadButtonLink: document.getElementById("uploadButtonLink"),
        About_us1: document.getElementById("About_us1"),
        About_us2: document.getElementById("About_us2"),
      };

      for (const [key, element] of Object.entries(elements)) {
        if (element) {
          element.textContent = translations[key];
        } else {
          console.error(`Element with ID '${key}' not found.`);
        }
      }
    } else {
      console.error("Translations object is not defined.");
    }
  };
  script.onerror = () => {
    console.error("Failed to load language script:", script.src);
  };
}