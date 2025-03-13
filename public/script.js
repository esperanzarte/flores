import { SYSTEM_PROMPT } from "./system_prompt.js";

document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chatContainer');
    const chatHeader = document.getElementById('chatHeader');
    const chatToggle = document.getElementById('chatToggle');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    // Inicia el historial de mensajes con el SYSTEM_PROMPT
    let chatHistory = [{ role: "system", content: SYSTEM_PROMPT }];

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

        // Agregar el mensaje del usuario al historial
        chatHistory.push({ role: "user", content: message });

        // Llamar a la API para obtener la respuesta
        getBotResponse();
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
    async function getBotResponse() {
        addMessage("Escribiendo...", "bot");  // Simula que está escribiendo
        
        try {
            const response = await fetch("https://flores-nlks.onrender.com/getBotResponse", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: chatHistory[chatHistory.length - 1].content  // Enviar solo el último mensaje
                })
            });

            const data = await response.json();
            const botReply = data.reply || "No entendí bien tu pregunta. ¿Puedes reformularla?";

            // Eliminar mensaje de "Escribiendo..."
            chatMessages.lastChild.remove();
            
            // Agregar la respuesta del bot
            addMessage(botReply, "bot");

            // Agregar la respuesta del bot al historial
            chatHistory.push({ role: "assistant", content: botReply });

        } catch (error) {
            console.error("Error al obtener respuesta:", error);
            chatMessages.lastChild.remove();
            addMessage("Hubo un problema al obtener la respuesta. Intenta de nuevo.", "bot");
        }
    }

    // Open chat after a delay
    setTimeout(() => {
        chatContainer.classList.add('open');
    }, 3000);

    // Slider de imágenes - Código nuevo y mejorado
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
            let newIndex = currentIndex + 1;
            if (newIndex >= slides.length) newIndex = 0;
            showSlide(newIndex);
        }
        
        function prevSlide() {
            let newIndex = currentIndex - 1;
            if (newIndex < 0) newIndex = slides.length - 1;
            showSlide(newIndex);
        }
        
        function startAutoplay() {
            if (slideInterval) clearInterval(slideInterval);
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
