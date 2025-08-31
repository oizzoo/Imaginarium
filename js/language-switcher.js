document.addEventListener('DOMContentLoaded', () => {
  const btnPL = document.getElementById('btn-pl');
  const btnEN = document.getElementById('btn-en');

  if (!btnPL || !btnEN) return;

  const repoPrefix = '/Imaginarium';

  // Mapowanie ścieżek dla zmiany języka
  const pathMap = {
    [repoPrefix + '/']: repoPrefix + '/en',
    [repoPrefix + '/en']: repoPrefix + '/',
    [repoPrefix + '/main']: repoPrefix + '/en-main',
    [repoPrefix + '/en-main']: repoPrefix + '/main',
    [repoPrefix + '/o-mnie']: repoPrefix + '/en-o-mnie',
    [repoPrefix + '/en-o-mnie']: repoPrefix + '/o-mnie',
    [repoPrefix + '/kontakt']: repoPrefix + '/en-kontakt',
    [repoPrefix + '/en-kontakt']: repoPrefix + '/kontakt',
    [repoPrefix + '/materialy/uniwersum-drugiej-ziemi']: repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi',
    [repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi']: repoPrefix + '/materialy/uniwersum-drugiej-ziemi',
    [repoPrefix + '/materialy/uniwersum-drugiej-ziemi/koncept-postaci']: repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi/koncept-postaci',
    [repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi/koncept-postaci']: repoPrefix + '/materialy/uniwersum-drugiej-ziemi/koncept-postaci',
    [repoPrefix + '/materialy/uniwersum-drugiej-ziemi/gdd']: repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi/gdd',
    [repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi/gdd']: repoPrefix + '/materialy/uniwersum-drugiej-ziemi/gdd',
    [repoPrefix + '/materialy/uniwersum-drugiej-ziemi/quest']: repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi/quest',
    [repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi/quest']: repoPrefix + '/materialy/uniwersum-drugiej-ziemi/quest',
    [repoPrefix + '/materialy/opowiadanie']: repoPrefix + '/en-materialy/opowiadanie',
    [repoPrefix + '/en-materialy/opowiadanie']: repoPrefix + '/materialy/opowiadanie',
    [repoPrefix + '/materialy/uniwersum-drugiej-ziemi/intro-dialog-uml']: repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi/intro-dialog-uml',
    [repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi/intro-dialog-uml']: repoPrefix + '/materialy/uniwersum-drugiej-ziemi/intro-dialog-uml',
    [repoPrefix + '/materialy/uniwersum-drugiej-ziemi/worldbuilding']: repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi/worldbuilding',
    [repoPrefix + '/en-materialy/uniwersum-drugiej-ziemi/worldbuilding']: repoPrefix + '/materialy/uniwersum-drugiej-ziemi/worldbuilding',
  };

  btnPL.addEventListener('click', () => {
    const currentPath = window.location.pathname;
    const newPath = pathMap[currentPath] || (repoPrefix + '/'); // Domyślnie wraca do strony głównej PL
    window.location.pathname = newPath;
  });

  btnEN.addEventListener('click', () => {
    const currentPath = window.location.pathname;
    const newPath = pathMap[currentPath] || (repoPrefix + '/en'); // Domyślnie wraca do strony głównej EN
    window.location.pathname = newPath;
  });

  // Ustawienie disabled dla aktywnego języka
  const lang = document.documentElement.lang;
  if (lang === 'pl') btnPL.disabled = true;
  else if (lang === 'en') btnEN.disabled = true;
});