window.addEventListener('load', () => {
  // Fonction asynchrone pour enregistrer le Service Worker lors du chargement de la page
  const registerServiceWorker = async () => {
    // Vérification si le navigateur prend en charge les Service Workers
    if ('serviceWorker' in navigator) {
      try {
        // Enregistrement du Service Worker 'sw.js' avec une portée spécifique
        const registration = await navigator.serviceWorker.register('sw.js', {
          scope: './',
        })

        // Vérification de l'état du Service Worker pour afficher des messages de journalisation appropriés
        if (registration.installing) {
          console.log('Service worker installing')
        } else if (registration.waiting) {
          console.log('Service worker installed')
        } else if (registration.active) {
          console.log('Service worker active')
        }
      } catch (error) {
        // Gestion des erreurs lors de l'enregistrement du Service Worker
        console.error(`Registration failed with ${error}`)
      }
    }
  }

  // Appel de la fonction pour enregistrer le Service Worker lors du chargement de la page
  registerServiceWorker()
})
