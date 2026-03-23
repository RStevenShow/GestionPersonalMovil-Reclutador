// 1. Guardamos la dirección de la casa de nuestro servidor (el backend).
const API_BASE_URL = "http://127.0.0.1:8000"; 

// 2. Preparamos nuestras "manos mágicas" para agarrar los modales de Bootstrap.
// Usamos el ID que pusimos en el HTML para saber cuál caja abrir.
const modalCargando = new bootstrap.Modal(document.getElementById('modal-cargando'));
const modalExito = new bootstrap.Modal(document.getElementById('modal-exito'));
const modalError = new bootstrap.Modal(document.getElementById('modal-error'));

// --- SECCIÓN DE REGISTRO (CREAR CUENTA NUEVA) ---

const formRegistro = document.getElementById('form-registro');

if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // ¡Abrimos la caja de "Cargando"! Aparece el circulito dando vueltas.
        modalCargando.show();

        const userData = {
            full_name: document.getElementById('reg-nombre').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value
        };

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            // Cerramos la caja de "Cargando" porque el cartero ya volvió.
            modalCargando.hide();

            if (response.ok) {
                // ¡Salió bien! Abrimos la caja de "Éxito".
                modalExito.show();

                // Esperamos 2 segundos para que el usuario esté feliz y lo mandamos al Login.
                setTimeout(() => {
                    window.location.href = "Login.html";
                }, 2000);
            } else {
                const error = await response.json();
                // Si hubo error, escribimos qué pasó en la caja de "Error" y la abrimos.
                document.getElementById('mensaje-error-texto').innerText = "Error: " + error.detail;
                modalError.show();
            }
        } catch (err) {
            modalCargando.hide();
            document.getElementById('mensaje-error-texto').innerText = "El servidor de Python está dormido.";
            modalError.show();
        }
    });
}

// --- SECCIÓN DE LOGIN (ENTRAR A LA CUENTA) ---

const formLogin = document.getElementById('form-login');

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        // ¡Abrimos la caja de "Cargando"! 
        modalCargando.show();

        const formData = new FormData();
        formData.append('username', document.getElementById('login-email').value);
        formData.append('password', document.getElementById('login-password').value);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                body: formData
            });

            // Cerramos la caja de "Cargando".
            modalCargando.hide();

            if (response.ok) {
                const data = await response.json();
                
                // Guardamos la llave mágica (Token) en el cajón secreto.
                localStorage.setItem('token', data.access_token);
                
                // Abrimos la caja de "Éxito".
                modalExito.show();

                // En 2 segundos entramos al menú principal.
                setTimeout(() => {
                    window.location.href = "menu.html";
                }, 2000);
            } else {
                // Si los datos están mal, escribimos el mensaje y mostramos la caja de "Error".
                document.getElementById('mensaje-error-texto').innerText = "Tu correo o contraseña están mal escritos.";
                modalError.show();
            }
        } catch (err) {
            modalCargando.hide();
            document.getElementById('mensaje-error-texto').innerText = "No hay conexión con el servidor.";
            modalError.show();
        }
    });
}