class ConvocatoriasApp {

    static init() {
        console.log('ConvocatoriasApp Init');

        // Inicializar Auth
        if (typeof AuthManager !== 'undefined') {
            AuthManager.init();
        }

        // Listener Login Form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.iniciarSesion(e));
        }

        // Inicializar animaciones de scroll si existiera lógica
        this.checkSession();
    }

    static checkSession() {
        // Actualizar UI basado en sesión (si hubiera contenido admin)
        const isAdmin = typeof AuthManager !== 'undefined' ? AuthManager.isAuthenticated() : false;
        // Si hubiera botones de edición/eliminar convocatorias, aquí se mostrarían
    }

    static iniciarSesion(e) {
        e.preventDefault();
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (AuthManager.login(email, password)) {
            const modalEl = document.getElementById('loginModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Usuario o contraseña incorrectos'
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => ConvocatoriasApp.init());
