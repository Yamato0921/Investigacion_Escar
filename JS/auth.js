class AuthManager {
    static API_URL = 'php/api_mongo.php';
    static isLoggedIn = false;

    static init() {
        this.isLoggedIn = localStorage.getItem('escar_token') !== null;
        console.log('AuthManager init, is Logged In:', this.isLoggedIn);

        // Listener para el formulario de login si existe
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const u = document.getElementById('username')?.value;
                const p = document.getElementById('password')?.value;

                if (await this.login(u, p)) {
                    Swal.fire('¡Éxito!', 'Bienvenido al sistema administrativo.', 'success')
                        .then(() => location.reload());
                } else {
                    Swal.fire('Error', 'Credenciales inválidas o error de conexión.', 'error');
                }
            });
        }

        this.updateLoginButton();
    }

    static updateLoginButton() {
        const btnLogin = document.querySelector('#loginContainer button');
        if (btnLogin) {
            const newBtn = btnLogin.cloneNode(true);
            btnLogin.parentNode.replaceChild(newBtn, btnLogin);

            if (this.isLoggedIn) {
                newBtn.innerHTML = '<i class="bi bi-person-check-fill me-2"></i>Admin (Cerrar Sesión)';
                newBtn.classList.remove('btn-outline-light');
                newBtn.classList.add('btn-light', 'text-primary', 'fw-bold');

                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logoutWithConfirmation();
                });
                newBtn.removeAttribute('data-bs-toggle');
                newBtn.removeAttribute('data-bs-target');
            } else {
                newBtn.innerHTML = '<i class="bi bi-person-circle me-2"></i>Acceso Admin';
                newBtn.classList.remove('btn-light', 'text-primary', 'fw-bold');
                newBtn.classList.add('btn-outline-light');

                newBtn.setAttribute('data-bs-toggle', 'modal');
                newBtn.setAttribute('data-bs-target', '#loginModal');
            }
        }
    }

    static async login(username, password) {
        try {
            const response = await fetch(`${this.API_URL}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success && data.token) {
                localStorage.setItem('escar_token', data.token);
                this.isLoggedIn = true;
                this.updateLoginButton();
                return true;
            } else {
                console.error('Login failed:', data.message);
                return false;
            }
        } catch (error) {
            console.error('Error in login fetch:', error);
            return false;
        }
    }

    static logout() {
        this.isLoggedIn = false;
        localStorage.removeItem('escar_token');
        this.updateLoginButton();
        location.reload(); // Recargar para limpiar estados de aplicaciones
    }

    static logoutWithConfirmation() {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: "Se cerrará su acceso de administrador",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.logout();
            }
        });
    }

    static isAuthenticated() {
        return this.isLoggedIn;
    }
}

// Iniciar automáticamente
document.addEventListener('DOMContentLoaded', () => AuthManager.init());
