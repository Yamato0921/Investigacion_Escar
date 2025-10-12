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
        const btnLogin = document.getElementById('btnLogin');
        if (btnLogin) {
            if (this.isLoggedIn) {
                btnLogin.innerHTML = '<i class="bi bi-person-check"></i> CERRAR SESIÓN';
                btnLogin.classList.remove('btn-outline-light');
                btnLogin.classList.add('btn-light', 'text-primary');
            } else {
                btnLogin.innerHTML = '<i class="bi bi-person"></i> INICIAR SESIÓN';
                btnLogin.classList.remove('btn-light', 'text-primary');
                btnLogin.classList.add('btn-outline-light');
            }
        }
    }

    static login(username, password) {
        // Simulación de autenticación
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

    static isAuthenticated() {
        return this.isLoggedIn;
    }
}
