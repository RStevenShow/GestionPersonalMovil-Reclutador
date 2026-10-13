# MarkNic Recruiting AI — aplicación de reclutamiento

Aplicación web móvil para reclutadores: inicio de sesión y registro, panel de control, vacantes, perfiles de candidatos, agenda de entrevistas y perfil del usuario. La interfaz está construida con HTML, CSS y JavaScript sin un proceso de compilación; la autenticación usa Supabase y los datos de reclutamiento se consultan a una API alojada en Render.

## Estructura del proyecto

```text
.
├── index.html                 # Entrada y redirección al login
├── Login.html                 # Inicio de sesión
├── Registro.html              # Alta de cuenta
├── Olvidar.html               # Solicitud de recuperación de contraseña
├── reset-password.html        # Cambio de contraseña
├── menu.html                  # Panel principal
├── vacantes.html              # Listado de vacantes
├── detalle_vacante.html       # Vacante y candidatos relacionados
├── detalle_candidato.html    # Análisis y agenda de entrevista
├── agenda.html                # Agenda de entrevistas
├── sala_entrevista.html       # Sala de entrevista
├── perfil.html                # Perfil y configuración
├── manifest.json              # Configuración instalable de la PWA
├── sw.js                      # Caché offline y notificaciones push
├── css/
│   └── app.css                # Estilos compartidos
├── js/
│   ├── pwa.js                 # Registro del Service Worker
│   ├── app.js                 # Preferencias de notificaciones push
│   ├── auth.js                # Flujos de autenticación
│   ├── vacantes.js            # Gestión de vacantes
│   ├── detalle_vacante.js     # Detalle de vacante
│   └── perfil.js              # Perfil del reclutador
├── icons/                     # Iconos PWA y de marca
├── assets/                    # Recursos gráficos adicionales
└── logo.png                   # Logotipo utilizado en la navegación
```

Las páginas permanecen en la raíz; las referencias a estilos y scripts apuntan a `css/` y `js/`. Las rutas relativas también permiten publicar el proyecto dentro de un subdirectorio del dominio.

## Ejecución local

1. Abre la carpeta del proyecto en VS Code.
2. Sirve la carpeta mediante una extensión de servidor local, por ejemplo **Live Server**. No abras las páginas con `file://`: los módulos PWA, las llamadas web y el almacenamiento requieren un servidor HTTP.
3. Abre la URL local que entrega el servidor. `localhost` es un contexto seguro aceptado por los navegadores para probar Service Workers.

No hay dependencias de compilación ni instalación de paquetes. Bootstrap, Bootstrap Icons, Chart.js y Supabase JS se cargan desde jsDelivr; para la primera carga se necesita conexión a Internet.

## Publicación y HTTPS

Publica **el contenido completo de esta carpeta** en un hosting de archivos estáticos. Mantén juntas las páginas raíz, `manifest.json`, `sw.js`, `css/`, `js/` e `icons/`; el Service Worker debe servirse desde la raíz de este conjunto para controlar todas las páginas.

La instalación PWA y las notificaciones requieren HTTPS en producción. `localhost` es la excepción para desarrollo. El manifest usa `./` como scope y rutas relativas, por lo que admite una publicación en la raíz del dominio o en un subdirectorio, siempre que el hosting respete las rutas de archivos y sirva `index.html` para la entrada.

Después de publicar una versión nueva, el Service Worker instala una caché `marknic-pwa-shell-v2` y elimina las cachés antiguas con el prefijo `marknic-pwa-` durante la activación. Para forzar una comprobación durante desarrollo, recarga la página o elimina el Service Worker y los datos del sitio desde las herramientas de desarrollo del navegador.

## Uso como PWA y modo offline

- `manifest.json` proporciona nombre, iconos, colores, acceso inicial y accesos directos a Agenda y Vacantes.
- `js/pwa.js` registra `sw.js` desde las pantallas de la aplicación.
- El Service Worker precarga las páginas y recursos locales; usa red primero para navegación y caché como respaldo. Los recursos estáticos de los CDN permitidos se guardan al usarse por primera vez.
- Para instalar, abre la aplicación publicada en HTTPS desde un navegador compatible y elige **Instalar aplicación** o **Añadir a pantalla de inicio**.
- El shell visual previamente cargado puede abrirse sin conexión. La autenticación, los datos de vacantes/candidatos, la agenda y las operaciones de escritura dependen de Supabase o de la API remota y no están disponibles offline. Las llamadas a API no se guardan en caché.
- Las notificaciones push necesitan permiso del usuario, HTTPS, soporte del navegador y configuración válida del backend/VAPID.

## Servicios externos

- **Autenticación:** Supabase Auth (y consulta de la tabla pública `user` para el flujo de recuperación).
- **API de reclutamiento:** `https://reclutamiento-backend.onrender.com`.
- **Recursos de interfaz:** Bootstrap, Bootstrap Icons, Chart.js y Supabase JS desde jsDelivr.

Los dominios de redirección para confirmación y recuperación de contraseña también deben estar autorizados en la configuración de Supabase y corresponder al dominio de producción. Si cambia el dominio de publicación, actualiza las URL `emailRedirectTo`/`redirectTo` de `js/auth.js`.

## Comprobaciones rápidas

1. Abre cada pantalla desde Inicio, Vacantes, Agenda y Perfil; verifica que la hoja de estilos y los scripts carguen correctamente.
2. En las herramientas de desarrollo, confirma que `manifest.json` no tenga iconos faltantes y que `sw.js` se registre sin errores.
3. Comprueba que el Service Worker quede activo y que las páginas visitadas previamente abran después de activar **Offline** en las herramientas de red.
4. Verifica que las operaciones que requieren cuenta funcionen con conexión y credenciales válidas.

## Notas de mantenimiento

- Al añadir un archivo local, actualiza las referencias HTML/JS y la lista `SHELL_FILES` de `sw.js` si debe estar precargado offline.
- Al cambiar archivos, incrementa la versión de `SHELL_CACHE` en `sw.js` para invalidar el shell en el próximo despliegue.
- Mantén los nombres/rutas de iconos sincronizados entre `manifest.json` y `icons/`.