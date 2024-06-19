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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  submitButton.disabled = true;
  fetch(scriptURL, { method: "POST", body: new FormData(form) })
    .then((response) => response.json())
    .then((response) => {
      if (response.result === "success") {
        alert("شكرا لك تم الإرسال بنجاح");
        window.location.reload();
      } else {
        throw new Error(response.error);
      }
    })
    .catch((error) => {
      console.error("خطأ في الإرسال!", error.message);
      submitButton.disabled = false;
    });
});
