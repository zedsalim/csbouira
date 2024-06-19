// Opacity for the navbar
// window.addEventListener("scroll", function () {
//   var navbar = document.querySelector(".navbar");
//   if (window.scrollY > 0) {
//     navbar.style.opacity = "0.95";
//   } else {
//     navbar.style.opacity = "1";
//   }
// });

// Contact Us Form
const scriptURL =
  "https://script.google.com/macros/s/AKfycbxzKTlh8C8QI9gbVmAI1smNS5dAi7ODB_z0phqQg92464uTvlYFuSkS5BtsE68-BuxhcQ/exec";
const form = document.forms["csb-contact-form"];
const submitButton = form.querySelector('button[type="submit"]');
const spinner = submitButton.querySelector("span");
const contactResult = document.getElementById("contact-result");
const resultMessage = contactResult.querySelector("strong");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  submitButton.disabled = true;
  spinner.className = "spinner-border spinner-border-sm";
  fetch(scriptURL, { method: "POST", body: new FormData(form) })
    .then((response) => response.json())
    .then((response) => {
      if (response.result === "success") {
        contactResult.className = "alert alert-success mt-3";
        resultMessage.textContent = "شكرا لك تم الإرسال بنجاح";
        form.reset();
      } else {
        throw new Error(response.error);
      }
    })
    .catch((error) => {
      console.error("خطأ في الإرسال!", error.message);
      contactResult.className = "alert alert-danger mt-3";
      resultMessage.textContent = "خطأ في الإرسال!";
    })
    .finally(() => {
      submitButton.disabled = false;
      spinner.className = "";
    });
});
