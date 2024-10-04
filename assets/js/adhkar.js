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
  "اللّه أكبر كبيرا",
  "الحمد لله رب العالمين",
  "أستغفر الله وأتوب إليه",
  "إنّا لله وإنّا إليه راجعون",
  "اللّهُمَّ إني أسألك الجنة",
  "اللّهُمَّ إني أعوذ بك من النار",
  "سبحانك اللهم وبحمدك",
  "اللهم إني أسألك علمًا نافعًا",
  "اللهم ارزقنا الهدى والتقى والعفاف والغنى",
  "3 x اعوذ بكلمات الله التامات من شر ما خلق",
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
