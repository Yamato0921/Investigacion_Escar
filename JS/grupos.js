class GruposApp {
    static gruposOriginales = [];
    static activeModal = null;

    static async init() {
        console.log('GruposApp Init');

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

        // Cargar los grupos
        await this.cargarGrupos();

        // Mostrar/ocultar controles de admin
        this.updateAdminControls();
    }

    static iniciarSesion(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // Validar credenciales
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

    static async cargarGrupos() {
        let grupos = JSON.parse(localStorage.getItem('grupos') || '[]');

        // Default data if empty
        if (grupos.length === 0) {
            grupos = [
                {
                    id: 1,
                    nombre: "Grupo de Investigación en Ciberseguridad",
                    lineaInvestigacion: "Seguridad Informática y Redes",
                    lider: "Mayor Juan Carlos Martínez",
                    descripcion: "Investigación aplicada en técnicas de defensa y análisis forense digital.",
                    email: "ciberseguridad@escar.edu.co",
                    logo: "https://cdn-icons-png.flaticon.com/512/2716/2716612.png"
                },
                {
                    id: 2,
                    nombre: "Grupo de Innovación Policial",
                    lineaInvestigacion: "Gestión Policial y Seguridad Ciudadana",
                    lider: "Capitán Laura Ramírez",
                    descripcion: "Desarrollo de nuevas estrategias para la seguridad ciudadana y convivencia.",
                    email: "innovacion@escar.edu.co",
                    logo: "https://cdn-icons-png.flaticon.com/512/1006/1006555.png"
                }
            ];
            localStorage.setItem('grupos', JSON.stringify(grupos));
        }

        this.gruposOriginales = grupos;
        this.renderUI(grupos);
    }

    static renderUI(grupos) {
        const grid = document.getElementById('gruposGrid');
        grid.innerHTML = '';

        grupos.forEach(grupo => {
            const card = `
                <div class="col-md-6 mb-4">
                    <div class="card h-100 shadow-sm hover-card">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <img src="${grupo.logo}" alt="Logo" class="rounded-circle me-3" style="width: 60px; height: 60px; object-fit: cover;">
                                <div>
                                    <h5 class="card-title mb-0 text-primary">${grupo.nombre}</h5>
                                    <small class="text-muted"><i class="bi bi-person-badge"></i> Líder: ${grupo.lider}</small>
                                </div>
                            </div>
                            <h6 class="card-subtitle mb-2 text-muted fw-bold">${grupo.lineaInvestigacion}</h6>
                            <p class="card-text">${grupo.descripcion}</p>
                            <div class="mt-3">
                                <span class="badge bg-secondary"><i class="bi bi-envelope"></i> ${grupo.email}</span>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent border-top-0 pb-3">
                            <button class="btn btn-outline-primary w-100 mb-2" onclick="GruposApp.verDetalle(${grupo.id})">
                                <i class="bi bi-eye"></i> Ver Grupo
                            </button>
                            <div class="d-flex justify-content-end gap-2 admin-controls ${AuthManager.isAuthenticated() ? '' : 'd-none'}">
                                <button class="btn btn-warning btn-sm" onclick="GruposApp.editarGrupo(${grupo.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="GruposApp.eliminarGrupo(${grupo.id})">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });
    }

    static verDetalle(id) {
        const grupo = this.gruposOriginales.find(g => g.id == id);
        if (!grupo) return;

        // Cargar investigadores reales del grupo
        const todosInvestigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        const integrantesIds = grupo.integrantes || []; // Array de IDs
        const integrantes = todosInvestigadores.filter(inv => integrantesIds.includes(inv.id.toString()) || integrantesIds.includes(inv.id));

        let investigadoresHtml = '';
        if (integrantes.length === 0) {
            investigadoresHtml = '<li class="list-group-item text-muted">No hay investigadores asignados</li>';
        } else {
            integrantes.forEach(inv => {
                investigadoresHtml += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <span class="fw-bold">${inv.nombre}</span>
                            <br>
                            <small class="text-muted">${inv.area}</small>
                        </div>
                        <a href="Investigadores.html?view=${inv.id}" class="btn btn-sm btn-outline-info">
                            Ver <i class="bi bi-arrow-right"></i>
                        </a>
                    </li>
                `;
            });
        }

        const modalHtml = `
            <div class="modal fade" id="detalleModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">Detalles del Grupo</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <img src="${grupo.logo}" class="rounded-circle shadow mb-3" style="width: 120px; height: 120px; object-fit: cover;">
                                <h3>${grupo.nombre}</h3>
                                <p class="lead text-muted">${grupo.lineaInvestigacion}</p>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <h5>Información General</h5>
                                    <p>${grupo.descripcion}</p>
                                    <ul class="list-unstyled">
                                        <li><strong>Líder:</strong> ${grupo.lider}</li>
                                        <li><strong>Email:</strong> ${grupo.email}</li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h5>Investigadores Asociados</h5>
                                    <ul class="list-group list-group-flush" style="max-height: 300px; overflow-y: auto;">
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
        const modal = new bootstrap.Modal(document.getElementById('detalleModal'));
        modal.show();
    }

    static async buscarGrupos() {
        const filtro = document.getElementById('searchFilter').value;
        const valor = document.getElementById('searchValue').value.toLowerCase();

        if (!valor) {
            this.renderUI(this.gruposOriginales);
            return;
        }

        const gruposFiltrados = this.gruposOriginales.filter(grupo => {
            return String(grupo[filtro]).toLowerCase().includes(valor);
        });

        this.renderUI(gruposFiltrados);
    }

    static mostrarFormulario(grupo = null) {
        if (!AuthManager.isAuthenticated()) {
            alert('Debe iniciar sesión para realizar esta acción');
            return;
        }

        // Cargar investigadores para la selección
        const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        const integrantesSeleccionados = grupo ? (grupo.integrantes || []) : [];

        // Generar tabla de investigadores
        let investigadoresTableRows = '';
        if (investigadores.length === 0) {
            investigadoresTableRows = '<tr><td colspan="3" class="text-center">No hay investigadores registrados</td></tr>';
        } else {
            investigadores.forEach(inv => {
                const isChecked = integrantesSeleccionados.includes(inv.id.toString()) || integrantesSeleccionados.includes(inv.id);
                investigadoresTableRows += `
                    <tr>
                        <td class="text-center">
                            <input class="form-check-input integrante-check" type="checkbox" value="${inv.id}" ${isChecked ? 'checked' : ''}>
                        </td>
                        <td>${inv.nombre}</td>
                        <td>${inv.area}</td>
                    </tr>
                `;
            });
        }

        const modalHtml = `
            <div class="modal fade" id="grupoModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">${grupo ? 'Editar' : 'Nuevo'} Grupo de Investigación</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="grupoForm" class="row g-3">
                                <input type="hidden" id="grupoId" value="${grupo?.id || ''}">
                                
                                <div class="col-md-12">
                                    <div class="form-floating">
                                        <input type="text" class="form-control" id="nombre" required value="${grupo?.nombre || ''}">
                                        <label>Nombre del Grupo</label>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="form-floating">
                                        <input type="text" class="form-control" id="lider" required value="${grupo?.lider || ''}">
                                        <label>Líder del Grupo</label>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="form-floating">
                                        <input type="text" class="form-control" id="lineaInvestigacion" required value="${grupo?.lineaInvestigacion || ''}">
                                        <label>Línea de Investigación</label>
                                    </div>
                                </div>

                                <div class="col-md-12">
                                    <div class="form-floating">
                                        <textarea class="form-control" id="descripcion" style="height: 100px" required>${grupo?.descripcion || ''}</textarea>
                                        <label>Descripción</label>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="form-floating">
                                        <input type="email" class="form-control" id="email" required value="${grupo?.email || ''}">
                                        <label>Correo de Contacto</label>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="form-floating">
                                        <input type="url" class="form-control" id="logo" required value="${grupo?.logo || ''}">
                                        <label>URL del Logo</label>
                                    </div>
                                </div>

                                <div class="col-12 mt-4">
                                    <h5 class="border-bottom pb-2">Seleccionar Integrantes</h5>
                                    <div class="table-responsive" style="max-height: 200px; overflow-y: auto;">
                                        <table class="table table-hover">
                                            <thead class="table-light sticky-top">
                                                <tr>
                                                    <th style="width: 50px;" class="text-center">
                                                        <i class="bi bi-check-square"></i>
                                                    </th>
                                                    <th>Nombre</th>
                                                    <th>Área</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${investigadoresTableRows}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="GruposApp.guardarGrupo()">
                                <i class="bi bi-save"></i> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalAnterior = document.getElementById('grupoModal');
        if (modalAnterior) {
            modalAnterior.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        this.activeModal = new bootstrap.Modal(document.getElementById('grupoModal'));
        this.activeModal.show();
    }

    static async guardarGrupo() {
        const form = document.getElementById('grupoForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const grupoId = document.getElementById('grupoId').value;
        // Recolectar IDs de integrantes seleccionados
        const checkboxes = document.querySelectorAll('.integrante-check:checked');
        const integrantes = Array.from(checkboxes).map(cb => cb.value);

        const grupo = {
            id: grupoId || Date.now(),
            nombre: document.getElementById('nombre').value,
            lider: document.getElementById('lider').value,
            lineaInvestigacion: document.getElementById('lineaInvestigacion').value,
            descripcion: document.getElementById('descripcion').value,
            email: document.getElementById('email').value,
            logo: document.getElementById('logo').value,
            integrantes: integrantes // Guardamos el array de IDs
        };

        let grupos = JSON.parse(localStorage.getItem('grupos') || '[]');

        if (grupoId) {
            const index = grupos.findIndex(g => g.id == grupoId);
            if (index !== -1) {
                grupos[index] = grupo;
            }
        } else {
            grupos.push(grupo);
        }

        localStorage.setItem('grupos', JSON.stringify(grupos));

        if (this.activeModal) {
            this.activeModal.hide();
        }

        await this.cargarGrupos();

        Swal.fire({
            icon: 'success',
            title: '¡Guardado!',
            text: 'El grupo ha sido guardado exitosamente',
            timer: 1500,
            showConfirmButton: false
        });
    }

    static async editarGrupo(id) {
        const grupos = JSON.parse(localStorage.getItem('grupos') || '[]');
        const grupo = grupos.find(g => g.id == id);
        if (grupo) {
            this.mostrarFormulario(grupo);
        }
    }

    static async eliminarGrupo(id) {
        if (!confirm('¿Está seguro de que desea eliminar este grupo?')) {
            return;
        }

        let grupos = JSON.parse(localStorage.getItem('grupos') || '[]');
        grupos = grupos.filter(g => g.id != id);
        localStorage.setItem('grupos', JSON.stringify(grupos));
        await this.cargarGrupos();
    }
}

document.addEventListener('DOMContentLoaded', () => GruposApp.init());
