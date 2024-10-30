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
/* ---- Language switcher ---- 
function switchLanguage(lang) {
  const script = document.createElement('script');
  script.src = `./js/lang-${lang}.js`;
  document.head.appendChild(script);
  script.addEventListener('load', () => {
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('welcomeMessage').textContent = translations.welcomeMessage;
      document.getElementById('description').textContent = translations.description;
      document.getElementById('grades').textContent = translations.grades;
      document.getElementById('licence1').textContent = translations.licence1;
      document.getElementById('licence2').textContent = translations.licence2;
    });
  });

  document.head.appendChild(script);
}
*/