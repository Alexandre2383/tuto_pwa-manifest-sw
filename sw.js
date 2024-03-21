/**
 *Definition du nom de notre cache permettant améliorant la performance et l'expérience hors-ligne
 */
const cacheName = 'Your-cache-name'

/**
 * Gestion de l'événement d'installation du Service Worker.
 * Cet événement est déclenché lorsque le Service Worker est installé,
 * via le fichier swRegister.js lors du chargement de l'application.
 * Pendant l'installation, le Service Worker met en cache les ressources nécessaires
 * pour l'application, telles que les fichiers HTML, JavaScript, CSS et les images.
 */
self.addEventListener('install', (event) => {
  // On utilise la méthode waitUntil pour indiquer au navigateur de ne pas considérer l'événement d'installation comme terminé
  // tant que la promesse retournée par cette fonction asynchrone n'est pas résolue ou rejetée
  event.waitUntil(
    (async () => {
      try {
        // Le code d'installation, tel que la mise en cache des ressources, est exécuté ici
        // Cette promesse sera résolue une fois que toutes les opérations asynchrones sont terminées
        self.skipWaiting()
        console.log(`${cacheName} Install`)
        await addResourcesToCache([
          './index.html',
          './swRegister.js',
          './sw.js',
          /***
           * Add here all the file your PWA need to work offline like js file, css, image, ect..
           */
        ])
      } catch (error) {
        // Gestion des erreurs potentielles
        console.error(`Error during installation: ${error}`)
      }
    })()
  )
})

/**
 * Gestion de l'événement d'activation du Service Worker.
 * Cet événement est déclenché après l'installation du Service Worker.
 * Pendant l'activation, le Service Worker nettoie les anciens caches et prend le contrôle immédiat des pages clients.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Utilisation d'une fonction asynchrone pour effectuer des opérations de nettoyage
    (async () => {
      try {
        // Prendre le contrôle immédiat des pages clientes
        clients.claim()
        // Affichage d'un message de journalisation indiquant que l'activation est réussie
        console.log(`${cacheName} Activate`)
        // Récupération de la liste des clés des caches existants
        const keys = await caches.keys()
        // Suppression des caches qui ne correspondent pas au cacheName actuel
        await Promise.all(
          keys.map(async (key) => {
            if (!key.includes(cacheName)) {
              await caches.delete(key)
            }
          })
        )
      } catch (error) {
        // Gestion des erreurs potentielles lors de l'activation
        console.error(`Error during activation: ${error}`)
      }
    })()
  )
})

/**
 * Ajout des ressources au cache du Service Worker.
 * Cette fonction prend une liste de ressources à mettre en cache
 * et les ajoute au cache spécifié par le nom.
 * @param {Array<string>} resources - La liste des URL des ressources à mettre en cache.
 */
const addResourcesToCache = async (resources) => {
  // Ouverture du cache spécifié par le nom 'cacheName'
  const cache = await caches.open(cacheName)
  // Ajout de toutes les ressources spécifiées au cache
  await cache.addAll(resources)
}

/**
 * Ajout d'une paire de requête-réponse au cache du Service Worker.
 * Cette fonction prend une requête et sa réponse correspondante
 * et les ajoute au cache spécifié par le nom.
 * @param {Request} request - L'objet Request représentant la requête à mettre en cache.
 * @param {Response} response - L'objet Response représentant la réponse à mettre en cache.
 */
const putInCache = async (request, response) => {
  // Ouverture du cache spécifié par le nom 'cacheName'
  const cache = await caches.open(cacheName)
  // Ajout de la paire de requête-réponse au cache
  await cache.put(request, response)
}

/**
 * Stratégie de mise en cache prioritaire dans le Service Worker.
 * Cette fonction vérifie d'abord si la ressource demandée est disponible dans le cache.
 * Si c'est le cas, elle renvoie la réponse mise en cache.
 * Sinon, elle tente de récupérer la ressource depuis le réseau et la met en cache avant de la renvoyer.
 * En cas d'erreur ou d'indisponibilité du réseau, elle renvoie une réponse de secours.
 * @param {Object} options - Options contenant la requête à traiter et l'URL de secours.
 * @param {Request} options.request - L'objet Request représentant la requête à traiter.
 * @param {string} options.fallbackUrl - L'URL de secours à utiliser en cas d'échec de récupération de la ressource.
 * @returns {Promise<Response>} - La promesse d'une réponse, soit mise en cache, soit récupérée depuis le réseau, soit une réponse de secours.
 */
const cacheFirst = async ({ request, fallbackUrl }) => {
  try {
    // Vérification si la ressource demandée est disponible dans le cache
    const responseFromCache = await caches.match(request)
    if (responseFromCache) {
      return responseFromCache
    }

    // Tentative de récupération de la ressource depuis le réseau
    const responseFromNetwork = await fetch(request.clone())
    // Mise en cache de la réponse récupérée depuis le réseau
    putInCache(request, responseFromNetwork.clone())
    return responseFromNetwork
  } catch (error) {
    // Gestion des erreurs
    console.error(`Error in cacheFirst: ${error}`)
    // Renvoi d'une réponse de secours en cas d'erreur ou d'indisponibilité du réseau
    const fallbackResponse = await caches.match(fallbackUrl)
    return (
      fallbackResponse ||
      new Response('Network error happened', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' },
      })
    )
  }
}

/**
 * Activation de la précharge de navigation dans le Service Worker, si prise en charge.
 * Cette fonction vérifie si la précharge de navigation est prise en charge par le navigateur.
 * Si c'est le cas, elle active la précharge de navigation.
 */
const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    // Vérifie si la précharge de navigation est prise en charge par le navigateur
    // Si oui, active la précharge de navigation
    await self.registration.navigationPreload.enable()
  }
}

/**
 * Gestion de l'événement de récupération de ressources ('fetch') par le Service Worker.
 * Cette fonction est appelée chaque fois qu'une ressource est récupérée par l'application.
 * Elle utilise la stratégie de mise en cache prioritaire (cacheFirst) pour traiter les requêtes.
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Utilisation de la stratégie de mise en cache prioritaire (cacheFirst) pour traiter la requête
    cacheFirst({
      request: event.request, // La requête à traiter
      preloadResponsePromise: event.preloadResponse, // La promesse de préchargement de réponse (le cas échéant)
      fallbackUrl: './index.html', // L'URL de secours à utiliser en cas d'échec de récupération de la ressource
    })
  )
})
