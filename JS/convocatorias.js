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
    },

    updateAdminControls() {
        const isAdmin = typeof AuthManager !== 'undefined' ? AuthManager.isAuthenticated() : false;
        document.querySelectorAll('.admin-controls, #adminControls').forEach(el => {
            if (isAdmin) el.classList.remove('d-none');
            else el.classList.add('d-none');
        });
    },

    async cargarConvocatorias() {
        const grid = document.getElementById('convocatoriasGrid');
        if (!grid) return;

        try {
            const resp = await fetch(`${this.API_URL}&action=list`);
            const data = await resp.json();

            if (data.success) {
                grid.innerHTML = '';
                if (data.data.length === 0) {
                    grid.innerHTML = '<div class="col-12 text-center py-5 text-muted"><h3>No hay convocatorias vigentes.</h3></div>';
                    return;
                }

                data.data.forEach(c => {
                    const card = `
                        <div class="col-lg-6 mb-4 animate__animated animate__zoomIn">
                            <div class="card shadow border-0 overflow-hidden hover-card">
                                <img src="${c.imagen}" class="img-fluid w-100" style="object-fit: contain; max-height: 800px; cursor: pointer;" 
                                     onclick="ConvocatoriasApp.verImagen('${c.imagen}')">
                                <div class="card-footer bg-light admin-controls ${typeof AuthManager !== 'undefined' && AuthManager.isAuthenticated() ? '' : 'd-none'}">
                                    <button class="btn btn-danger btn-sm w-100" onclick="ConvocatoriasApp.eliminarConvocatoria('${c.id || c._id}')">
                                        <i class="bi bi-trash me-2"></i>Eliminar Flayer
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    grid.innerHTML += card;
                });
            }
        } catch (e) {
            console.error('Error cargando convocatorias:', e);
            grid.innerHTML = '<div class="col-12 text-center py-5 text-danger"><h3>Error al conectar con Atlas.</h3></div>';
        }
    },

    mostrarModal() {
        const form = document.getElementById('flayerForm');
        form.reset();
        document.getElementById('flayerPreviewContainer').classList.add('d-none');
        this.modalInstance.show();
    },

    async guardarFlayer(e) {
        e.preventDefault();
        const fileInput = document.getElementById('flayerImagen');
        const file = fileInput.files[0];
        if (!file) return;

        Swal.fire({ title: 'Subiendo flyer a Atlas...', didOpen: () => Swal.showLoading() });

        try {
            const b64 = await this.convertToBase64(file);
            const formData = new FormData();
            formData.append('imagen', b64);

            const token = localStorage.getItem('escar_token');
            const resp = await fetch(`${this.API_URL}&action=create`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await resp.json();
            if (data.success) {
                Swal.fire('¡Publicado!', 'El flyer de la convocatoria está en línea.', 'success');
                this.modalInstance.hide();
                this.cargarConvocatorias();
            }
        } catch (e) {
            Swal.fire('Error', 'No se pudo publicar el flyer.', 'error');
        }
    },

    async eliminarConvocatoria(id) {
        const res = await Swal.fire({ title: '¿Eliminar flyer?', icon: 'warning', showCancelButton: true });
        if (res.isConfirmed) {
            const token = localStorage.getItem('escar_token');
            await fetch(`${this.API_URL}&action=delete&id=${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            this.cargarConvocatorias();
            Swal.fire('Eliminado', '', 'success');
        }
    },

    verImagen(url) {
        Swal.fire({
            imageUrl: url,
            showConfirmButton: false,
            showCloseButton: true,
            width: 'auto',
            padding: '0',
            background: 'transparent',
            customClass: { popup: 'border-0', image: 'rounded shadow-lg' },
            showClass: { popup: 'animate__animated animate__zoomIn animate__faster' }
        });
    },

    setupEventListeners() {
        const form = document.getElementById('flayerForm');
        if (form) form.onsubmit = (e) => this.guardarFlayer(e);

        const input = document.getElementById('flayerImagen');
        if (input) input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    document.getElementById('flayerPreview').src = evt.target.result;
                    document.getElementById('flayerPreviewContainer').classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        };
    },

    convertToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ConvocatoriasApp.init());
window.ConvocatoriasApp = ConvocatoriasApp;
```
