// js/menu.js
document.addEventListener('DOMContentLoaded', () => {
    // Sprawdź czy to mobile
  const isMobile = window.innerWidth <= 768;

  // Znajdź element "Materiały"
  const materialyItem = document.querySelector('.side-menu > ul > li.has-submenu');
  
  if (materialyItem) {
    const menuLabel = materialyItem.querySelector('.menu-label');
    
    if (menuLabel) {
      // Stwórz strzałkę (◄ celuje w lewo)
      const arrow = document.createElement('span');
      arrow.className = 'submenu-arrow';
      arrow.innerHTML = ' ◄'; // Strzałka w lewo
      arrow.style.cssText = 'display: inline-block; transition: transform 0.3s ease; margin-left: 0.5em; font-size: 0.8em;';
      
      // Dodaj strzałkę do "Materiały"
      menuLabel.appendChild(arrow);
      
      // Sprawdź localStorage czy submenu było otwarte
      if (!isMobile) {
        const wasOpen = localStorage.getItem('materialy-open') === 'true';
        if (wasOpen) {
            materialyItem.classList.add('submenu-open');
            arrow.style.transform = 'rotate(-90deg)'; // Obrót w dół
         }
      }  
      // Klik w cały element "Materiały" (tekst + strzałka) = toggle
      menuLabel.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Toggle submenu
        materialyItem.classList.toggle('submenu-open');
        
        // Obróć strzałkę
        if (materialyItem.classList.contains('submenu-open')) {
          arrow.style.transform = 'rotate(-90deg)'; // W dół
          if (!isMobile) {
             localStorage.setItem('materialy-open', 'true'); // Zapamiętaj stan
          }
        } else {
          arrow.style.transform = 'rotate(0deg)'; // W lewo
          if (!isMobile) {
             localStorage.removeItem('materialy-open'); // Usuń stan
          }
        }
      });
    }
  }
});