document.addEventListener("DOMContentLoaded", function () {
  const elements = document.querySelectorAll(".in-progress");
  elements.forEach(function (element) {
    element.addEventListener("click", function (event) {
      event.preventDefault();
      alert(
        "غير متاح حاليا. إذا كانت لديك أي ملفات، فلا تتردد في رفعها على القناة المخصصة في الموقع.",
      );
    });
  });
});
