// Main Script for Index.html
document.addEventListener("DOMContentLoaded", () => {
  updateStatistics();
});

// Utility function to animate number counting
function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  if (!obj) return;

  if (start === end) {
    obj.innerHTML = end;
    return;
  }

  const range = end - start;
  let current = start;
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / range));

  // Safety check for very fast animations
  const safeStepTime = Math.max(stepTime, 10);

  const timer = setInterval(function () {
    current += increment;
    obj.innerHTML = current;
    if (current == end) {
      clearInterval(timer);
    }
  }, safeStepTime);
}

const API_URL_STATS = 'http://localhost/Investigacion_Escar/php/api.php';

async function updateStatistics() {
  try {
    // 1. Proyectos (antes Grupos)
    fetch(`${API_URL_STATS}?action=list_proyectos`)
      .then(res => res.json())
      .then(data => {
        const count = data.success ? data.data.length : 0;
        animateValue("stats-grupos", 0, count, 2000);
      });

    // 2. Investigadores
    fetch(`${API_URL_STATS}?action=list`)
      .then(res => res.json())
      .then(data => {
        const count = data.success ? data.data.length : 0;
        animateValue("stats-investigadores", 0, count, 2000);
      });

    // 3. Semilleros
    fetch(`${API_URL_STATS}?action=list_semilleros`)
      .then(res => res.json())
      .then(data => {
        const count = data.success ? data.data.length : 0;
        animateValue("stats-semilleros", 0, count, 2000);
      });

  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Scroll Animations & Back to Top
document.addEventListener("DOMContentLoaded", () => {
  // 1. Scroll Fade In
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in-section').forEach(section => {
    observer.observe(section);
  });

  // 2. Back to Top Button
  const mybutton = document.getElementById("btn-back-to-top");

  window.onscroll = function () {
    scrollFunction();
  };

  function scrollFunction() {
    if (!mybutton) return;
    if (
      document.body.scrollTop > 20 ||
      document.documentElement.scrollTop > 20
    ) {
      mybutton.style.display = "block";
    } else {
      mybutton.style.display = "none";
    }
  }

  mybutton.addEventListener("click", backToTop);

  function backToTop() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }
});
