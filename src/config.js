export const CONFIG = {
  assets: {
    logo: '/images/csb-logo-text.jpg',
    hero: '/images/csb-hero-logo.png',
    navLogo: '/images/csb-nav-logo.png',
    aboutSvg: '/images/about-us.svg',
    favicon: '/images/favicon.ico',
  },
  api: {
    base: 'https://api.csbouira.xyz/api/drive',
    search: 'https://api.csbouira.xyz/api/drive',
    upload:
      'https://script.google.com/macros/s/AKfycbxMikLNPWYBEWjYJ7FSLJAHV_dZ_5E6aSGarqtm7kubMsjzXFHXnW4s-eEM2RtFOaF3/exec',
    contact:
      'https://script.google.com/macros/s/AKfycbzmfa0TDm_Ec9CtZSpSvIv7knXucmv_67xyh6APXDnsdMnb-0NukESFq58ZbVlm0GqEcg/exec',
  },
  years: {
    licence: ['Licence 1', 'Licence 2', 'Licence 3 SI'],
    master1: ['Master 1 GSI', 'Master 1 ISIL', 'Master 1 IA'],
    master2: ['Master 2 GSI', 'Master 2 ISIL', 'Master 2 IA'],
  },
  dhikr: {
    list: [
      'أستغفر اللّه',
      'سبحان اللّه',
      'الحمد للّه',
      'لا إله إلا اللّه',
      'اللّه أكبر',
      'سبحان اللّه وبحمده',
      'سبحان اللّه العظيم',
      'لا حول ولا قوة إلا باللّه',
      'اللّهم صل وسلم على نبينا محمد',
      'لا إله إلا أنت سبحانك إني كنت من الظالمين',
      'ربي اغفر لي ولوالدي وللمؤمنين',
      'اللّه أكبر كبيرا',
      'سبحان الله بكرة واصيلا',
      'الحمد لله رب العالمين',
      'أستغفر الله وأتوب إليه',
      'إنّا لله وإنّا إليه راجعون',
      'اللّهُمَّ إني أسألك الجنة',
      'اللّهُمَّ إني أعوذ بك من النار',
      'سبحانك اللهم وبحمدك',
      'اللهم إني أسألك علمًا نافعًا',
      'اللهم إني أسألك الهدى و التقى و العفاف و الغنى',
      '3 x اعوذ بكلمات الله التامات من شر ما خلق',
      'اللهم لاسهل إلا ماجعلته سهلا وأنت تجعل الحزن إذا شئت سهلا',
      'اللهم اغفر لي ذنبي كله دقه وجله وأوله وآخره وعلانيته وسره',
      'اللهم اني اعوذ بك من الهم والحزن',
    ],
  },
  theme: {
    light: 'csb-light',
    dark: 'csb-dark',
  },
  favorites: {
    storageKey: 'csbouira_favorites',
  },
  // Grade calculator (ported from Moadaly). Ids match src/data/moadaly/*.json
  moadaly: {
    storageKey: 'csbouira_moadaly',
    groups: {
      Licence: {
        L1Info: 'Licence 1',
        L1MI: 'Licence 1 MI (before 2025)',
        L2Info: 'Licence 2',
        'L2Info-old': 'Licence 2 (before 2025)',
        L3SI: 'Licence 3 SI',
        'L3SI-old': 'Licence 3 SI (before 2025)',
        L3ISIL: 'Licence 3 ISIL',
      },
      'Master 1': {
        M1GSI: 'Master 1 GSI',
        M1ISIL: 'Master 1 ISIL',
        M1IA: 'Master 1 IA',
      },
      'Master 2': {
        M2GSI: 'Master 2 GSI',
        M2ISIL: 'Master 2 ISIL',
        M2IA: 'Master 2 IA',
        'M2IA-old': 'Master 2 IA (before 2026)',
      },
    },
  },
};
