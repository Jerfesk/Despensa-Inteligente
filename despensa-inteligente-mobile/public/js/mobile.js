// This file contains mobile-specific JavaScript logic for the Progressive Web App (PWA) version of the Despensa Inteligente project.

document.addEventListener('DOMContentLoaded', function() {
    // Register the service worker for PWA functionality
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(function(error) {
                console.error('Service Worker registration failed:', error);
            });
        });
    }

    // Add touch event listeners for mobile interactions
    const buttons = document.querySelectorAll('.btn-recipe, .btn-edit, .btn-del');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.classList.add('active');
        });
        button.addEventListener('touchend', function() {
            this.classList.remove('active');
        });
    });

    // Implement responsive behaviors
    const mediaQuery = window.matchMedia('(max-width: 600px)');
    function handleResponsive() {
        const container = document.querySelector('.container');
        if (mediaQuery.matches) {
            container.style.padding = '10px';
        } else {
            container.style.padding = '20px';
        }
    }

    mediaQuery.addListener(handleResponsive);
    handleResponsive();
});