            function animateProgressBar(percent) {
                const circle = document.getElementById('progress-bar');
                const radius = circle.r.baseVal.value;
                const circumference = 2 * Math.PI * radius;
        
                circle.style.strokeDasharray = `${circumference}`;
                const offset = circumference - (percent / 100) * circumference;
        
                // Actualiza el offset para llenar la barra
                circle.style.strokeDashoffset = offset;
        
                // Animar el texto del porcentaje
                animateText(0, percent);
            }
        
            function animateText(start, end) {
                const duration = 1500; // Duración de la animación en ms
                const startTime = performance.now();
        
                function update() {
                    const currentTime = performance.now();
                    const elapsed = currentTime - startTime;
        
                    // Proporción del tiempo transcurrido
                    const progress = Math.min(elapsed / duration, 1);
                    const current = Math.floor(start + (end - start) * progress);
                    document.getElementById('progress-text').textContent = `${current}%`;
        
                    if (progress < 1) {
                        requestAnimationFrame(update);
                    }
                }
        
                requestAnimationFrame(update);
            }
        
            // Intersection Observer para detectar cuando el elemento está en pantalla
            const progressCircle = document.querySelector('.relative');
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Inicia la animación cuando el elemento es visible
                        animateProgressBar(51); // Cambia este valor por el porcentaje que desees
                        observer.unobserve(progressCircle); // Detiene la observación después de la primera animación
                    }
                });
            });
        
            // Observa la sección de progreso
            observer.observe(progressCircle);