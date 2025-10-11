// Slider functionality
document.addEventListener("DOMContentLoaded", () => {
  const sliderTrack = document.getElementById("sliderTrack")
  const prevBtn = document.getElementById("prevBtn")
  const nextBtn = document.getElementById("nextBtn")
  const sliderItems = document.querySelectorAll(".slider-item")

  let currentIndex = 0
  const totalItems = sliderItems.length
  let itemsPerView = 3
  let autoSlideInterval

  // Función para actualizar itemsPerView según el ancho de pantalla
  function updateItemsPerView() {
    const width = window.innerWidth
    if (width <= 640) {
      itemsPerView = 1
    } else if (width <= 968) {
      itemsPerView = 2
    } else {
      itemsPerView = 3
    }
  }

  // Función para mover el slider
  function moveSlider(index) {
    const maxIndex = totalItems - itemsPerView

    if (index < 0) {
      currentIndex = maxIndex
    } else if (index > maxIndex) {
      currentIndex = 0
    } else {
      currentIndex = index
    }

    const itemWidth = sliderItems[0].offsetWidth
    const gap = 15
    const offset = -(currentIndex * (itemWidth + gap))

    sliderTrack.style.transform = `translateX(${offset}px)`
  }

  // Función para avanzar automáticamente
  function autoSlide() {
    moveSlider(currentIndex + 1)
  }

  // Iniciar auto-slide
  function startAutoSlide() {
    stopAutoSlide()
    autoSlideInterval = setInterval(autoSlide, 5000)
  }

  // Detener auto-slide
  function stopAutoSlide() {
    if (autoSlideInterval) {
      clearInterval(autoSlideInterval)
    }
  }

  // Event listeners para botones
  prevBtn.addEventListener("click", () => {
    moveSlider(currentIndex - 1)
    startAutoSlide() // Reiniciar el auto-slide después de interacción manual
  })

  nextBtn.addEventListener("click", () => {
    moveSlider(currentIndex + 1)
    startAutoSlide() // Reiniciar el auto-slide después de interacción manual
  })

  // Event listener para cambios de tamaño de ventana
  window.addEventListener("resize", () => {
    updateItemsPerView()
    moveSlider(currentIndex)
  })

  // Pausar auto-slide cuando el mouse está sobre el slider
  sliderTrack.addEventListener("mouseenter", stopAutoSlide)
  sliderTrack.addEventListener("mouseleave", startAutoSlide)

  // Inicialización
  updateItemsPerView()
  moveSlider(0)
  startAutoSlide()
})
