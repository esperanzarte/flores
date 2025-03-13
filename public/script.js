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

    // Función para alternar el chat
    function toggleChat() {
        chatContainer.classList.toggle('open');
        const chevronIcon = chatToggle.querySelector('i');
        chevronIcon.style.transform = chatContainer.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0)';
    }
    
    // Agregar eventos de click y touch al encabezado del chat
    chatHeader.addEventListener('click', toggleChat);
    chatHeader.addEventListener('touchend', function(e) {
        e.preventDefault();
        toggleChat();
    });

    // Manejo del formulario de chat
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message === '') return;
        addMessage(message, 'user');
        chatInput.value = '';
        getBotResponse(message);
    });

    // Función para agregar mensajes al chat
    function addMessage(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
        messageElement.textContent = text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Mostrar indicador de "Escribiendo..."
    function showTypingIndicator() {
        let typingIndicator = document.querySelector('.typing-indicator');
        if (!typingIndicator) {
            typingIndicator = document.createElement('div');
            typingIndicator.classList.add('message', 'bot-message', 'typing-indicator');
            typingIndicator.textContent = "Escribiendo...";
            chatMessages.appendChild(typingIndicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    // Ocultar el indicador de "Escribiendo..."
    function hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Obtener respuesta del servidor (backend)
    async function getBotResponse(message) {
        showTypingIndicator();  // Mostrar indicador de "Escribiendo..."
        
        try {
            const response = await fetch("https://flores-nlks.onrender.com/getBotResponse", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId, // Enviar el ID único del usuario
                    message // Enviar el último mensaje
                })
            });

            const data = await response.json();
            const botReply = data.reply || "No entendí bien tu pregunta. ¿Puedes reformularla?";
            
            hideTypingIndicator();  // Ocultar indicador de "Escribiendo..."
            const formattedReply = formatResponse(botReply);
            addMessage(formattedReply, "bot");
        } catch (error) {
            console.error("Error al obtener respuesta:", error);
            hideTypingIndicator();  // Ocultar indicador de "Escribiendo..."
            addMessage("Hubo un problema al obtener la respuesta. Intenta de nuevo.", "bot");
        }
    }

    // Abrir el chat automáticamente después de 3 segundos
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
            showSlide((currentIndex + 1) % slides.length);
        }

        function prevSlide() {
            showSlide((currentIndex - 1 + slides.length) % slides.length);
        }

        function startAutoplay() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000); // Cambiar slide cada 5 segundos
        }

        function stopAutoplay() {
            clearInterval(slideInterval);
        }

        // Eventos para click y touch en botones
        if (prevBtn) {
            prevBtn.addEventListener('click', e => { e.preventDefault(); prevSlide(); stopAutoplay(); startAutoplay(); });
            prevBtn.addEventListener('touchend', e => { e.preventDefault(); prevSlide(); stopAutoplay(); startAutoplay(); });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', e => { e.preventDefault(); nextSlide(); stopAutoplay(); startAutoplay(); });
            nextBtn.addEventListener('touchend', e => { e.preventDefault(); nextSlide(); stopAutoplay(); startAutoplay(); });
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', e => { e.preventDefault(); showSlide(index); stopAutoplay(); startAutoplay(); });
            dot.addEventListener('touchend', e => { e.preventDefault(); showSlide(index); stopAutoplay(); startAutoplay(); });
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
