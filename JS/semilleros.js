class SemillerosApp {
    static semillerosOriginales = [];

    static async init() {
        console.log('SemillerosApp Init');
        
        // Configurar el botón de login
        const btnLogin = document.getElementById('btnLogin');
        if (btnLogin) {
            btnLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Actualizar UI según estado de autenticación
        this.actualizarBotonLogin();
        
        // Cargar los semilleros
        await this.cargarSemilleros();
        
        // Mostrar/ocultar controles de admin
        this.updateAdminControls();
    }

    static handleLogin() {
        if (AuthManager.isAuthenticated()) {
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                AuthManager.logout();
                location.reload();
            }
        } else {
            const username = prompt('Usuario:');
            if (!username) return;
            
            const password = prompt('Contraseña:');
            if (!password) return;

            if (AuthManager.login(username, password)) {
                alert('Inicio de sesión exitoso');
                location.reload();
            } else {
                alert('Credenciales incorrectas');
            }
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
        console.log('Updating admin controls, isAdmin:', isAdmin);
        adminControls.forEach(el => {
            el.classList.toggle('d-none', !isAdmin);
        });
    }

    static async cargarSemilleros() {
        const semilleros = JSON.parse(localStorage.getItem('semilleros') || '[]');
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
        
        semilleros.forEach(sem => {
            const card = `
                <div class="col-12 mb-3">
                    <div class="card">
                        <div class="card-body d-flex align-items-center p-3">
                            <div class="me-4" style="width: 100px; height: 100px;">
                                <img src="${sem.logo}" 
                                     class="img-fluid rounded-circle"
                                     alt="${sem.nombre}"
                                     style="width: 100px; height: 100px; object-fit: cover;">
                            </div>
                            <div class="flex-grow-1">
                                <h4 class="text-primary mb-1">${sem.nombre}</h4>
                                <div class="mb-2">
                                    <strong>Código del semillero:</strong> ${sem.codigo}<br>
                                    <strong>Responsable del semillero:</strong> ${sem.responsable}<br>
                                    <strong>Unidad académica responsable:</strong> ${sem.unidadAcademica}<br>
                                    <strong>Acrónimo:</strong> ${sem.acronimo}<br>
                                    <strong>Fecha de creación:</strong> ${new Date(sem.fechaCreacion).toLocaleDateString('es-CO')}
                                </div>
                                <button class="btn btn-outline-primary btn-sm px-4">
                                    Ver semillero
                                </button>
                                <div class="admin-controls d-inline-block ms-2 ${AuthManager.isAuthenticated() ? '' : 'd-none'}">
                                    <button class="btn btn-warning btn-sm" onclick="SemillerosApp.editarSemillero(${sem.id})">
                                        <i class="bi bi-pencil"></i> Editar
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="SemillerosApp.eliminarSemillero(${sem.id})">
                                        <i class="bi bi-trash"></i> Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });
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
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('semilleroModal'));
        modal.show();
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
        this.modal.hide();
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
        if (!confirm('¿Está seguro de que desea eliminar este semillero?')) {
            return;
        }

        let semilleros = JSON.parse(localStorage.getItem('semilleros') || '[]');
        semilleros = semilleros.filter(s => s.id != id);
        localStorage.setItem('semilleros', JSON.stringify(semilleros));
        await this.cargarSemilleros();
    }
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => SemillerosApp.init());
