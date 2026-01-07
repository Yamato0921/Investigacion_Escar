class ProyectosApp {
    static modalInstance = null;

    static async init() {
        console.log('ProyectosApp Init (Enhanced)');

        const modalEl = document.getElementById('proyectoModal');
        if (modalEl) {
            this.modalInstance = new bootstrap.Modal(modalEl);
        }

        // Inicializar Auth
        if (typeof AuthManager !== 'undefined') {
            AuthManager.init();
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.iniciarSesion(e));
        }

        this.actualizarBotonLogin();
        this.cargarProyectos();
        this.updateAdminControls();
        this.setupEventListeners();
    }

    static iniciarSesion(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail') ? document.getElementById('loginEmail').value : document.getElementById('username').value;
        const password = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value : document.getElementById('password').value;

        if (AuthManager.login(email, password)) {
            const modalEl = document.getElementById('loginModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                timer: 1500,
                showConfirmButton: false
            }).then(() => location.reload());
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Credenciales inválidas' });
        }
    }

    static actualizarBotonLogin() {
        if (typeof AuthManager !== 'undefined') AuthManager.updateLoginButton();
    }

    static updateAdminControls() {
        const adminControls = document.querySelectorAll('.admin-controls, #adminControls');
        const isAdmin = typeof AuthManager !== 'undefined' ? AuthManager.isAuthenticated() : false;

        adminControls.forEach(el => {
            if (isAdmin) {
                el.classList.remove('d-none');
            } else {
                el.classList.add('d-none');
            }
        });
    }

    static cargarProyectos() {
        const proyectos = JSON.parse(localStorage.getItem('proyectos') || '[]');
        this.renderUI(proyectos);
    }

    static renderUI(proyectos) {
        const grid = document.getElementById('proyectosGrid');
        if (!grid) return;

        // FIX: Asegurar visibilidad
        grid.classList.add('is-visible');
        grid.classList.remove('fade-in-section');

        grid.innerHTML = '';

        if (proyectos.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center text-muted py-5 animate__animated animate__fadeIn"><h3>No hay proyectos publicados.</h3></div>';
            return;
        }

        proyectos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        proyectos.forEach(p => {
            const card = `
                <div class="col-md-6 col-lg-4 mb-4 animate__animated animate__fadeIn">
                    <div class="card h-100 shadow-sm border-0 hover-card">
                        <img src="${p.imagen || 'https://via.placeholder.com/400x200'}" class="card-img-top" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title fw-bold text-primary">${p.titulo}</h5>
                            <p class="card-text text-muted text-truncate">${p.descripcion}</p>
                        </div>
                        <div class="card-footer bg-white border-0 d-flex justify-content-between align-items-center">
                            <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="ProyectosApp.verDetalle(${p.id})">Leer Más</button>
                            <small class="text-muted">${p.fecha}</small>
                        </div>
                        <div class="card-footer bg-light admin-controls d-none">
                            <div class="d-flex gap-2">
                                <button class="btn btn-warning btn-sm flex-fill" onclick="ProyectosApp.editarProyecto(${p.id})"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-danger btn-sm flex-fill" onclick="ProyectosApp.eliminarProyecto(${p.id})"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
             `;
            grid.innerHTML += card;
        });

        this.updateAdminControls();
    }

    static mostrarModal(proyecto = null) {
        if (!AuthManager.isAuthenticated()) {
            Swal.fire('Error', 'Debe iniciar sesión', 'error');
            return;
        }

        document.getElementById('proyectoId').value = proyecto ? proyecto.id : '';
        document.getElementById('titulo').value = proyecto ? proyecto.titulo : '';
        document.getElementById('contenido').value = proyecto ? proyecto.descripcion : '';

        document.getElementById('imagen').value = '';
        document.getElementById('existingImagen').value = proyecto ? proyecto.imagen : '';

        const preview = document.getElementById('imagenPreview');
        const previewContainer = document.getElementById('previewContainer');

        if (proyecto && proyecto.imagen) {
            if (preview) preview.src = proyecto.imagen;
            if (previewContainer) previewContainer.classList.remove('d-none');
        } else {
            if (previewContainer) previewContainer.classList.add('d-none');
        }

        if (this.modalInstance) this.modalInstance.show();
    }

    static guardarProyecto() {
        const id = document.getElementById('proyectoId').value;
        const titulo = document.getElementById('titulo').value;
        const descripcion = document.getElementById('contenido').value;
        const imagenInput = document.getElementById('imagen');
        const existingImagen = document.getElementById('existingImagen').value;

        if (!titulo || !descripcion) {
            Swal.fire('Error', 'Complete los campos obligatorios', 'warning');
            return;
        }

        const procesarGuardado = (imagenUrl) => {
            const nuevo = {
                id: id || Date.now(),
                titulo,
                imagen: imagenUrl,
                descripcion,
                fecha: new Date().toISOString().split('T')[0]
            };

            let proyectos = JSON.parse(localStorage.getItem('proyectos') || '[]');
            if (id) {
                const idx = proyectos.findIndex(p => p.id == id);
                if (idx !== -1) proyectos[idx] = nuevo;
            } else {
                proyectos.push(nuevo);
            }

            localStorage.setItem('proyectos', JSON.stringify(proyectos));
            if (this.modalInstance) this.modalInstance.hide();
            this.cargarProyectos();
            Swal.fire('Guardado', '', 'success');
        };

        if (imagenInput && imagenInput.files && imagenInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => procesarGuardado(e.target.result);
            reader.readAsDataURL(imagenInput.files[0]);
        } else {
            procesarGuardado(existingImagen || 'https://via.placeholder.com/400x200');
        }
    }

    static editarProyecto(id) {
        const proyectos = JSON.parse(localStorage.getItem('proyectos') || '[]');
        const p = proyectos.find(x => x.id == id);
        if (p) this.mostrarModal(p);
    }

    static eliminarProyecto(id) {
        Swal.fire({
            title: '¿Eliminar proyecto?',
            text: "No se podrá revertir esta acción de borrado",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                let proyectos = JSON.parse(localStorage.getItem('proyectos') || '[]');
                proyectos = proyectos.filter(p => p.id != id);
                localStorage.setItem('proyectos', JSON.stringify(proyectos));
                this.cargarProyectos();
                Swal.fire(
                    'Eliminado!',
                    'El proyecto ha sido eliminado.',
                    'success'
                );
            }
        });
    }

    static verDetalle(id) {
        const proyectos = JSON.parse(localStorage.getItem('proyectos') || '[]');
        const p = proyectos.find(x => x.id == id);
        if (!p) return;

        const modalEl = document.getElementById('lecturaModal');
        if (modalEl) {
            const imgEl = document.getElementById('lecturaImagen');
            const titEl = document.getElementById('lecturaTitulo');
            const dateEl = document.getElementById('lecturaFecha');
            const contEl = document.getElementById('lecturaContenido');

            if (imgEl) imgEl.src = p.imagen;
            if (titEl) titEl.textContent = p.titulo;
            if (dateEl) dateEl.textContent = p.fecha;
            if (contEl) contEl.textContent = p.descripcion;

            new bootstrap.Modal(modalEl).show();
        }
    }

    static setupEventListeners() {
        const imagenInput = document.getElementById('imagen');
        if (imagenInput) {
            imagenInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const img = document.getElementById('imagenPreview');
                        const cont = document.getElementById('previewContainer');
                        if (img) img.src = evt.target.result;
                        if (cont) cont.classList.remove('d-none');
                    }
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => ProyectosApp.init());
window.ProyectosApp = ProyectosApp;
