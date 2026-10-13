/* Registro global del Service Worker para cualquier pantalla de la aplicación. */
(() => {
  if (!("serviceWorker" in navigator)) return;

  const scriptUrl = document.currentScript?.src || new URL("js/pwa.js", location.href).href;
  const serviceWorkerUrl = new URL("../sw.js", scriptUrl);

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(serviceWorkerUrl.href)
      .then((registration) => {
        console.info("PWA: Service Worker registrado.", registration.scope);
      })
      .catch((error) => {
        console.error("PWA: no se pudo registrar el Service Worker.", error);
      });
  }, { once: true });
})();
