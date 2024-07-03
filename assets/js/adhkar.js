const dhikr = [
  "أستغفر اللّه",
  "سبحان اللّه",
  "الحمد للّه",
  "لا إله إلا اللّه",
  "اللّه أكبر",
  "سبحان اللّه وبحمده",
  "سبحان اللّه العظيم",
  "لا حول ولا قوة إلا باللّه",
  "اللّهم صل وسلم على نبينا محمد",
  "لا إله إلا أنت سبحانك إني كنت من الظالمين",
  "رب اغفر لي",
];

function getRandomDhikr() {
  return dhikr[Math.floor(Math.random() * dhikr.length)];
}

const adhkar = document.getElementById("adhkar");
const adhkarText = document.getElementById("adhkarText");
const closeAdhkar = document.getElementById("closeAdhkar");

const randomDhikr = getRandomDhikr();
adhkarText.textContent = randomDhikr;

closeAdhkar.addEventListener("click", () => {
  adhkar.style.display = "none";
});
