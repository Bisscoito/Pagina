// js/main.js
document.addEventListener('DOMContentLoaded', function() {
    // Configurações iniciais
    const elements = {
        devName: document.getElementById('devName'),
        devDescription: document.getElementById('devDescription'),
        appDescription: document.getElementById('appDescription'),
        devPhoto: document.getElementById('devPhoto')
    };

    // Dados dinâmicos
    if (elements.devName) elements.devName.textContent = 'Daniel R Fraga';
    if (elements.devDescription) elements.devDescription.textContent = 'Desenvolvedor entusiasta do mundo tecnológico...';
    // Continue com outras configurações...
});

// Função compartilhada para abrir links
function openLink(url, newTab = true) {
    if (newTab) {
        window.open(url, '_blank');
    } else {
        window.location.href = url;
    }
}
