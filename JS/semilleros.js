class SemillerosApp {
    static semillerosOriginales = [];

    static async init() {
        console.log('SemillerosApp Init');

        // Configurar el botón de login
        const btnLogin = document.getElementById('btnLogin');
        if (btnLogin) {
            btnLogin.addEventListener('click', (e) => {
                e.preventDefault();
                if (AuthManager.isAuthenticated()) {
                    if (confirm('¿Está seguro que desea cerrar sesión?')) {
                        AuthManager.logout();
                        location.reload();
                    }
                } else {
                    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                    loginModal.show();
                }
            });
        }

        // Configurar el formulario de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.iniciarSesion(e));
        }

        // Actualizar UI según estado de autenticación
        this.actualizarBotonLogin();

        // Cargar los semilleros
        await this.cargarSemilleros();

        // Mostrar/ocultar controles de admin
        this.updateAdminControls();
    }

    static iniciarSesion(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Validar credenciales (admin/admin123 para demo)
        if (AuthManager.login(email, password) || (email === 'admin' && password === 'admin123')) {
            Swal.fire({
                icon: 'success',
                title: '¡Bienvenido!',
                text: 'Has iniciado sesión correctamente',
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

    static actualizarBotonLogin() {
        const btnLogin = document.getElementById('btnLogin');
        if (!btnLogin) return;

        if (AuthManager.isAuthenticated()) {
            btnLogin.innerHTML = '<i class="bi bi-person-check"></i> CERRAR SESIÓN';
            btnLogin.classList.remove('btn-outline-light');
            btnLogin.classList.add('btn-light', 'text-primary');
        } else {
            btnLogin.innerHTML = '<i class="bi bi-person"></i> INICIAR SESIÓN';
            btnLogin.classList.remove('btn-light', 'text-primary');
            btnLogin.classList.add('btn-outline-light');
        }
    }

    static updateAdminControls() {
        const adminControls = document.querySelectorAll('.admin-controls');
        const isAdmin = AuthManager.isAuthenticated();
        adminControls.forEach(el => {
            if (isAdmin) {
                el.classList.remove('d-none');
            } else {
                el.classList.add('d-none');
            }
        });
    }

    static async cargarSemilleros() {
        let semilleros = JSON.parse(localStorage.getItem('semilleros') || '[]');

        // Si no hay semilleros, agregar algunos por defecto para demostración
        if (semilleros.length === 0) {
            semilleros = [
                {
                    id: 1,
                    nombre: "Semillero de Investigación en Inteligencia Artificial",
                    codigo: "SIA-001",
                    responsable: "Dr. Carlos Rodríguez",
                    unidadAcademica: "Ingeniería de Sistemas",
                    acronimo: "SIA",
                    fechaCreacion: "2023-01-15",
                    logo: "https://cdn-icons-png.flaticon.com/512/2083/2083213.png",
                    estado: "ACTIVO"
                },
                {
                    id: 2,
                    nombre: "Semillero de Energías Renovables",
                    codigo: "SER-002",
                    responsable: "Dra. María López",
                    unidadAcademica: "Ingeniería Ambiental",
                    acronimo: "SER",
                    fechaCreacion: "2023-03-20",
                    logo: "https://cdn-icons-png.flaticon.com/512/3109/3109839.png",
                    estado: "ACTIVO"
                }
            ];
            localStorage.setItem('semilleros', JSON.stringify(semilleros));
        }

        this.semillerosOriginales = semilleros;
        this.renderUI(semilleros);
    }

    static async buscarSemilleros() {
        const filtro = document.getElementById('searchFilter').value;
        const valor = document.getElementById('searchValue').value.toLowerCase();

        if (!valor) {
            this.renderUI(this.semillerosOriginales);
            return;
        }

        const semillerosFiltrados = this.semillerosOriginales.filter(semillero => {
            return semillero[filtro].toLowerCase().includes(valor);
        });

        this.renderUI(semillerosFiltrados);
    }

    static renderUI(semilleros) {
        const grid = document.getElementById('semillerosGrid');
        grid.innerHTML = '';

        semilleros.forEach(semillero => {
            const card = `
                <div class="col-md-6 mb-4 animate__animated animate__fadeIn">
                    <div class="card h-100 shadow-sm hover-card">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <img src="${semillero.logo}" alt="Logo" class="rounded-circle me-3" style="width: 60px; height: 60px; object-fit: cover;">
                                <div>
                                    <h5 class="card-title mb-0 text-primary">${semillero.nombre}</h5>
                                    <small class="text-muted"><i class="bi bi-person-badge"></i> Resp: ${semillero.responsable}</small>
                                </div>
                            </div>
                            <h6 class="card-subtitle mb-2 text-muted fw-bold">${semillero.unidadAcademica}</h6>
                            <p class="card-text"><i class="bi bi-upc-scan"></i> Código: ${semillero.codigo}</p>
                            <p class="card-text"><i class="bi bi-tag"></i> Acrónimo: ${semillero.acronimo}</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <span class="badge ${semillero.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}">${semillero.estado || 'ACTIVO'}</span>
                                <small class="text-muted"><i class="bi bi-calendar"></i> ${semillero.fechaCreacion}</small>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent border-top-0 pb-3">
                            <button class="btn btn-outline-primary w-100 mb-2" onclick="SemillerosApp.verDetalle(${semillero.id})">
                                <i class="bi bi-eye"></i> Ver Semillero
                            </button>
                            <div class="d-flex justify-content-end gap-2 admin-controls ${AuthManager.isAuthenticated() ? '' : 'd-none'}">
                                <button class="btn btn-warning btn-sm flex-grow-1" onclick="SemillerosApp.editarSemillero(${semillero.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-danger btn-sm flex-grow-1" onclick="SemillerosApp.eliminarSemillero(${semillero.id})">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });

        // Re-check admin controls
        this.updateAdminControls();
    }

    static verDetalle(id) {
        const semillero = this.semillerosOriginales.find(s => s.id == id);
        if (!semillero) return;

        // Mock investigadores data
        const investigadoresMock = [
            { id: 1, nombre: "Juan Pérez", area: "Inteligencia Artificial" },
            { id: 2, nombre: "María García", area: "Machine Learning" }
        ];

        let investigadoresHtml = '';
        investigadoresMock.forEach(inv => {
            investigadoresHtml += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${inv.nombre}
                    <small class="text-muted">${inv.area}</small>
                    <a href="Investigadores.html?view=${inv.id}" class="btn btn-sm btn-outline-info">
                        Ver Investigador <i class="bi bi-arrow-right"></i>
                    </a>
                </li>
            `;
        });

        const modalHtml = `
            <div class="modal fade" id="detalleModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">Detalles del Semillero</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <img src="${semillero.logo}" class="rounded-circle shadow mb-3" style="width: 120px; height: 120px; object-fit: cover;">
                                <h3>${semillero.nombre}</h3>
                                <p class="lead text-muted">${semillero.unidadAcademica}</p>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <h5>Información General</h5>
                                    <ul class="list-unstyled">
                                        <li><strong>Código:</strong> ${semillero.codigo}</li>
                                        <li><strong>Responsable:</strong> ${semillero.responsable}</li>
                                        <li><strong>Acrónimo:</strong> ${semillero.acronimo}</li>
                                        <li><strong>Fecha Creación:</strong> ${semillero.fechaCreacion}</li>
                                        <li><strong>Estado:</strong> <span class="badge ${semillero.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}">${semillero.estado || 'ACTIVO'}</span></li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h5>Investigadores Asociados</h5>
                                    <ul class="list-group list-group-flush">
                                        ${investigadoresHtml}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const oldModal = document.getElementById('detalleModal');
        if (oldModal) oldModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('detalleModal'), { backdrop: false }); // backdrop false to avoid double backdrop if needed, or default
        modal.show();
    }

    static mostrarFormulario(semillero = null) {
        if (!AuthManager.isAuthenticated()) {
            alert('Debe iniciar sesión para realizar esta acción');
            return;
        }

        const modalHtml = `
            <div class="modal fade" id="semilleroModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">${semillero ? 'Editar' : 'Nuevo'} Semillero</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="semilleroForm" class="row g-3">
                                <input type="hidden" id="semilleroId" value="${semillero?.id || ''}">
                                
                                <div class="col-md-12">
                                    <div class="form-floating">
                                        <input type="text" class="form-control" id="nombre" required value="${semillero?.nombre || ''}">
                                        <label>Nombre del Semillero</label>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="form-floating">
                                        <input type="text" class="form-control" id="codigo" required value="${semillero?.codigo || ''}">
                                        <label>Código del Semillero</label>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="form-floating">
                                        <input type="text" class="form-control" id="responsable" required value="${semillero?.responsable || ''}">
                                        <label>Responsable del Semillero</label>
                                    </div>
                                </div>

                                <div class="col-md-12">
                                    <div class="form-floating">
                                        <input type="text" class="form-control" id="unidadAcademica" required value="${semillero?.unidadAcademica || ''}">
                                        <label>Unidad Académica Responsable</label>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="form-floating">
                                        <input type="text" class="form-control" id="acronimo" required value="${semillero?.acronimo || ''}">
                                        <label>Acrónimo</label>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="form-floating">
                                        <input type="date" class="form-control" id="fechaCreacion" required value="${semillero?.fechaCreacion || ''}">
                                        <label>Fecha de Creación</label>
                                    </div>
                                </div>

                                <div class="col-md-12">
                                    <div class="form-floating">
                                        <input type="url" class="form-control" id="logo" required value="${semillero?.logo || ''}">
                                        <label>URL del Logo</label>
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="form-floating">
                                        <select class="form-select" id="estado" required>
                                            <option value="ACTIVO" ${semillero?.estado === 'ACTIVO' ? 'selected' : ''}>Activo</option>
                                            <option value="INACTIVO" ${semillero?.estado === 'INACTIVO' ? 'selected' : ''}>Inactivo</option>
                                        </select>
                                        <label>Estado</label>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="SemillerosApp.guardarSemillero()">
                                <i class="bi bi-save"></i> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal anterior si existe
        const modalAnterior = document.getElementById('semilleroModal');
        if (modalAnterior) {
            modalAnterior.remove();
        }

        // Agregar nuevo modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar modal y guardar referencia
        this.activeModal = new bootstrap.Modal(document.getElementById('semilleroModal'));
        this.activeModal.show();
    }

    static async guardarSemillero() {
        const form = document.getElementById('semilleroForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const semilleroId = document.getElementById('semilleroId').value;
        const semillero = {
            id: semilleroId || Date.now(),
            nombre: document.getElementById('nombre').value,
            codigo: document.getElementById('codigo').value,
            responsable: document.getElementById('responsable').value,
            unidadAcademica: document.getElementById('unidadAcademica').value,
            acronimo: document.getElementById('acronimo').value,
            fechaCreacion: document.getElementById('fechaCreacion').value,
            logo: document.getElementById('logo').value,
            estado: document.getElementById('estado').value
        };

        let semilleros = JSON.parse(localStorage.getItem('semilleros') || '[]');

        if (semilleroId) {
            const index = semilleros.findIndex(s => s.id == semilleroId);
            if (index !== -1) {
                semilleros[index] = semillero;
            }
        } else {
            semilleros.push(semillero);
        }

        localStorage.setItem('semilleros', JSON.stringify(semilleros));

        if (this.activeModal) {
            this.activeModal.hide();
        } else {
            // Fallback try to find modal
            const el = document.getElementById('semilleroModal');
            const instance = bootstrap.Modal.getInstance(el);
            if (instance) instance.hide();
        }

        await this.cargarSemilleros();
    }

    static async editarSemillero(id) {
        const semilleros = JSON.parse(localStorage.getItem('semilleros') || '[]');
        const semillero = semilleros.find(s => s.id == id);
        if (semillero) {
            this.mostrarFormulario(semillero);
        }
    }

    static async eliminarSemillero(id) {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            let semilleros = JSON.parse(localStorage.getItem('semilleros') || '[]');
            semilleros = semilleros.filter(s => s.id != id);
            localStorage.setItem('semilleros', JSON.stringify(semilleros));

            await this.cargarSemilleros();

            Swal.fire(
                '¡Eliminado!',
                'El semillero ha sido eliminado.',
                'success'
            );
        }
    }
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => SemillerosApp.init());
