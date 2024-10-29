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
  "ربي اغفر لي ولوالدي وللمؤمنين",
  "اللّه أكبر كبيرا",
  "سبحان الله بكرة واصيلا",
  "الحمد لله رب العالمين",
  "أستغفر الله وأتوب إليه",
  "إنّا لله وإنّا إليه راجعون",
  "اللّهُمَّ إني أسألك الجنة",
  "اللّهُمَّ إني أعوذ بك من النار",
  "سبحانك اللهم وبحمدك",
  "اللهم إني أسألك علمًا نافعًا",
  "اللهم إني أسألك الهدى و التقى و العفاف و الغنى",
  "3 x اعوذ بكلمات الله التامات من شر ما خلق",
  "اللهم لاسهل إلا ماجعلته سهلا وأنت تجعل الحزن إذا شئت سهلا",
  "اللهم اغفر لي ذنبي كله دقه وجله وأوله وآخره وعلانيته وسره",
  "اللهم اني اعوذ بك من الهم والحزن",
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
