class AuthManager {
    static isLoggedIn = false;

    static {
        // Inicializar al cargar la clase
        this.isLoggedIn = localStorage.getItem('isAdmin') === 'true';
        console.log('AuthManager loaded, isLoggedIn:', this.isLoggedIn);
    }

    static init() {
        // Verificar si hay una sesión activa
        this.isLoggedIn = localStorage.getItem('isAdmin') === 'true';
        this.updateLoginButton();
    }

    static updateLoginButton() {
        // En este template, el botón está dentro de #loginContainer y no tiene ID propio
        const btnLogin = document.querySelector('#loginContainer button');

        if (btnLogin) {
            // Eliminar listeners previos clonando el botón
            const newBtn = btnLogin.cloneNode(true);
            btnLogin.parentNode.replaceChild(newBtn, btnLogin);

            if (this.isLoggedIn) {
                newBtn.innerHTML = '<i class="bi bi-person-check-fill me-2"></i>Admin (Salir)';
                newBtn.classList.remove('btn-outline-light');
                newBtn.classList.add('btn-light', 'text-primary', 'fw-bold');

                // Agregar evento de logout con confirmación
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logoutWithConfirmation();
                });

                // Remover atributos de modal para que no abra el login
                newBtn.removeAttribute('data-bs-toggle');
                newBtn.removeAttribute('data-bs-target');
            } else {
                newBtn.innerHTML = '<i class="bi bi-person-circle me-2"></i>Acceso Admin';
                newBtn.classList.remove('btn-light', 'text-primary', 'fw-bold');
                newBtn.classList.add('btn-outline-light');

                // Restaurar atributos de modal
                newBtn.setAttribute('data-bs-toggle', 'modal');
                newBtn.setAttribute('data-bs-target', '#loginModal');
            }
        }
    }

    static login(username, password) {
        // Simulación de autenticación (Legacy Logic)
        if (username === 'admin' && password === 'admin123') {
            this.isLoggedIn = true;
            localStorage.setItem('isAdmin', 'true');
            this.updateLoginButton();
            return true;
        }
        return false;
    }

    static logout() {
        this.isLoggedIn = false;
        localStorage.removeItem('isAdmin');
        this.updateLoginButton();
    }

    static logoutWithConfirmation() {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: "Se cerrará su sesión de administrador",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.logout();
                Swal.fire({
                    title: '¡Sesión cerrada!',
                    text: 'Has salido correctamente.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    location.reload();
                });
            }
        });
    }

    static isAuthenticated() {
        return this.isLoggedIn;
    }
}
