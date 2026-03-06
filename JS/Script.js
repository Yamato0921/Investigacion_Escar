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

const API_URL_STATS = 'php/api_mongo.php';

async function updateStatistics() {
  console.log('Script.js: Updating statistics from MongoDB...');

  const categories = [
    { col: 'proyectos', id: 'stats-grupos', label: 'Proyectos' },
    { col: 'investigadores', id: 'stats-investigadores', label: 'Investigadores' },
    { col: 'semilleros', id: 'stats-semilleros', label: 'Semilleros' }
  ];

  for (const cat of categories) {
    try {
      const response = await fetch(`${API_URL_STATS}?action=list&col=${cat.col}`);
      const data = await response.json();

      console.log(`Stats for ${cat.label}:`, data);

      if (data.success && Array.isArray(data.data)) {
        const count = data.data.length;
        animateValue(cat.id, 0, count, 2000);
      } else {
        console.warn(`API returned success:false for ${cat.label} or data is not array`);
        document.getElementById(cat.id).innerText = '0';
      }
    } catch (error) {
      console.error(`Error fetching stats for ${cat.label}:`, error);
      document.getElementById(cat.id).innerText = '0';
    }
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
