import { SYSTEM_PROMPT } from "./system_prompt.js";

document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chatContainer');
    const chatHeader = document.getElementById('chatHeader');
    const chatToggle = document.getElementById('chatToggle');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    // Obtener o generar un userId único para el usuario
    let userId = localStorage.getItem("userId");
    if (!userId) {
        userId = `user_${Date.now()}`;
        localStorage.setItem("userId", userId);
    }

    // Función para formatear la respuesta de GPT
    function formatResponse(response) {
        const sentences = response.split(/(?<=[.!?])\s+/); // Divide en oraciones
        return sentences.join('\n\n'); // Une con doble salto de línea
    }

    // Toggle chat abierto/cerrado
    chatHeader.addEventListener('click', function() {
        chatContainer.classList.toggle('open');
        const chevronIcon = chatToggle.querySelector('i');
        chevronIcon.style.transform = chatContainer.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0)';
    });

    // Manejo del formulario de chat
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const message = chatInput.value.trim();
        if (message === '') return;

        addMessage(message, 'user');
        chatInput.value = '';

        // Llamar a la API para obtener la respuesta
        getBotResponse(message);
    });

    // Agregar mensajes al chat
    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        messageElement.textContent = text;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Obtener respuesta del servidor (backend) en vez de OpenAI directamente
    async function getBotResponse(message) {
        addMessage("Escribiendo...", "bot");  // Simula que está escribiendo
        
        try {
            const response = await fetch("https://flores-nlks.onrender.com/getBotResponse", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId, // Enviar el ID único del usuario
                    message // Solo se envía el último mensaje
                })
            });

            const data = await response.json();
            const botReply = data.reply || "No entendí bien tu pregunta. ¿Puedes reformularla?";

            hideTypingIndicator();  // Ocultar indicador de "Escribiendo..."

            // Formatear la respuesta del bot antes de mostrarla
            const formattedReply = formatResponse(botReply);
            addMessage(formattedReply, "bot");  // Agregar la respuesta formateada

        } catch (error) {
            console.error("Error al obtener respuesta:", error);
            hideTypingIndicator();  // Ocultar indicador de "Escribiendo..."
            addMessage("Hubo un problema al obtener la respuesta. Intenta de nuevo.", "bot");
        }
    }

    // Ocultar el indicador de "Escribiendo..."
    function hideTypingIndicator() {
        const typingIndicator = chatMessages.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Abrir el chat automáticamente después de un tiempo
    setTimeout(() => {
        chatContainer.classList.add('open');
    }, 3000);

    // ========== SLIDER DE IMÁGENES ==========
    function initImageSlider() {
        const slider = document.querySelector('.hero-slider');
        if (!slider) return;

        const slides = slider.querySelectorAll('.slide');
        const dots = slider.querySelectorAll('.dot');
        const prevBtn = slider.querySelector('.slider-arrow.prev');
        const nextBtn = slider.querySelector('.slider-arrow.next');
        
        let currentIndex = 0;
        let slideInterval;

        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            slides[index].classList.add('active');
            dots[index].classList.add('active');
            
            currentIndex = index;
        }

        function nextSlide() {
            let newIndex = (currentIndex + 1) % slides.length;
            showSlide(newIndex);
        }

        function prevSlide() {
            let newIndex = (currentIndex - 1 + slides.length) % slides.length;
            showSlide(newIndex);
        }

        function startAutoplay() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000); // Cambiar slide cada 5 segundos
        }

        function stopAutoplay() {
            clearInterval(slideInterval);
        }

        if (prevBtn) prevBtn.addEventListener('click', e => { e.preventDefault(); prevSlide(); stopAutoplay(); startAutoplay(); });
        if (nextBtn) nextBtn.addEventListener('click', e => { e.preventDefault(); nextSlide(); stopAutoplay(); startAutoplay(); });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', e => { e.preventDefault(); showSlide(index); stopAutoplay(); startAutoplay(); });
        });

        slider.addEventListener('mouseenter', stopAutoplay);
        slider.addEventListener('mouseleave', startAutoplay);

        showSlide(0);
        startAutoplay();
    }

    // Inicializar el slider
    initImageSlider();

    // ========== CARGA PEREZOSA (Lazy Load) ==========
    const lazyElements = document.querySelectorAll('.lazy-load');
    const options = { root: null, rootMargin: '0px', threshold: 0.1 };

    const lazyLoad = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                if (element.tagName.toLowerCase() === 'video') {
                    element.src = element.dataset.src;
                    element.load();
                    element.classList.remove('lazy-load');
                }
                observer.unobserve(element);
            }
        });
    };

    const observer = new IntersectionObserver(lazyLoad, options);
    lazyElements.forEach(element => observer.observe(element));
});
