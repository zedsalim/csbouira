// Contact Us Form
const scriptURL =
  "https://script.google.com/macros/s/AKfycbx0LHpwOaIdiUOSgHRwObCABVbyHcsxcFFqjAz04nU56R244NRWSUBFob-IP7fJzvcayQ/exec";
var form = document.forms["csb-contact-form"];
var submitButton = document.getElementById("submit-contact");
var spinner = submitButton.querySelector("span");
var contactResult = document.getElementById("contact-result");
var resultMessage = contactResult.querySelector("strong");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  submitButton.disabled = true;
  spinner.className = "spinner-border spinner-border-sm";
  fetch(scriptURL, { method: "POST", body: new FormData(form) })
    .then((response) => response.json())
    .then((response) => {
      if (response.result === "success") {
        contactResult.className = "alert alert-success mt-3";
        resultMessage.textContent = "تم الإرسال بنجاح";
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
