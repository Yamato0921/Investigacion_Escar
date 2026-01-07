class SemillerosApp {
    static semillerosOriginales = [];
    static activeModal = null;

    static async init() {
        console.log('SemillerosApp Enhanced Init');

        if (typeof AuthManager !== 'undefined') {
            AuthManager.init();
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.iniciarSesion(e));
        }

        this.actualizarBotonLogin();
        await this.cargarSemilleros();
        this.updateAdminControls();
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
        if (typeof AuthManager !== 'undefined') {
            AuthManager.updateLoginButton();
        }
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

    static async cargarSemilleros() {
        let semilleros = JSON.parse(localStorage.getItem('semilleros') || '[]');
        this.semillerosOriginales = semilleros;
        this.renderUI(semilleros);
    }

    static renderUI(semilleros) {
        const grid = document.getElementById('semillerosGrid');
        if (!grid) return;

        grid.classList.add('is-visible');
        grid.classList.remove('fade-in-section');

        grid.innerHTML = '';

        if (semilleros.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center my-5 animate__animated animate__fadeIn"><h3 class="text-muted">No se encontraron semilleros</h3></div>';
            return;
        }

        semilleros.forEach(semillero => {
            const card = `
                <div class="col-md-6 mb-4 animate__animated animate__fadeIn">
                    <div class="card h-100 shadow-sm hover-card">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <img src="${semillero.logo || 'https://via.placeholder.com/60'}" alt="Logo" class="rounded-circle me-3 border" style="width: 60px; height: 60px; object-fit: cover;">
                                <div>
                                    <h5 class="card-title mb-0 text-primary">${semillero.nombre}</h5>
                                    <small class="text-muted"><i class="bi bi-person-badge"></i> Resp: ${semillero.responsable}</small>
                                </div>
                            </div>
                            <h6 class="card-subtitle mb-2 text-muted fw-bold">${semillero.unidadAcademica}</h6>
                            <p class="card-text mb-1"><i class="bi bi-upc-scan"></i> Código: ${semillero.codigo}</p>
                            <p class="card-text mb-1"><i class="bi bi-tag"></i> Acrónimo: ${semillero.acronimo}</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <span class="badge ${semillero.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}">${semillero.estado || 'ACTIVO'}</span>
                                <small class="text-muted"><i class="bi bi-calendar"></i> ${semillero.fechaCreacion}</small>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent border-top-0 pb-3">
                            <button class="btn btn-outline-primary w-100 mb-2" onclick="SemillerosApp.verDetalle(${semillero.id})">
                                <i class="bi bi-eye"></i> Ver Semillero
                            </button>
                            <div class="d-flex justify-content-end gap-2 admin-controls d-none">
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

        this.updateAdminControls();
    }

    static verDetalle(id) {
        const semillero = this.semillerosOriginales.find(s => s.id == id);
        if (!semillero) return;

        // Cargar investigadores asociados
        const todosInvestigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        const asociados = todosInvestigadores.filter(inv => (semillero.investigadoresIds || []).includes(inv.id.toString()));

        let investigadoresHtml = '';
        if (asociados.length > 0) {
            investigadoresHtml = '<div class="list-group list-group-flush">';
            asociados.forEach(inv => {
                investigadoresHtml += `
                    <div class="list-group-item d-flex align-items-center border-0 px-0">
                        <img src="${inv.foto || 'https://via.placeholder.com/40'}" class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;">
                        <div>
                            <h6 class="mb-0">${inv.nombre}</h6>
                            <small class="text-muted">${inv.area}</small>
                        </div>
                    </div>
                `;
            });
            investigadoresHtml += '</div>';
        } else {
            investigadoresHtml = '<p class="text-muted fst-italic">No hay investigadores asociados.</p>';
        }

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
                                <img src="${semillero.logo || 'https://via.placeholder.com/120'}" class="rounded-circle shadow mb-3" style="width: 120px; height: 120px; object-fit: cover;">
                                <h3>${semillero.nombre}</h3>
                                <p class="lead text-muted">${semillero.unidadAcademica}</p>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <h5 class="border-bottom pb-2">Información General</h5>
                                    <ul class="list-unstyled mt-3">
                                        <li class="mb-2"><strong>Código:</strong> ${semillero.codigo}</li>
                                        <li class="mb-2"><strong>Responsable:</strong> ${semillero.responsable}</li>
                                        <li class="mb-2"><strong>Acrónimo:</strong> ${semillero.acronimo}</li>
                                        <li class="mb-2"><strong>Fecha Creación:</strong> ${semillero.fechaCreacion}</li>
                                        <li class="mb-2"><strong>Estado:</strong> <span class="badge ${semillero.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}">${semillero.estado || 'ACTIVO'}</span></li>
                                    </ul>
                                </div>
                                <div class="col-md-6 border-start">
                                    <h5 class="border-bottom pb-2">Investigadores Asociados</h5>
                                    <div class="mt-3" style="max-height: 300px; overflow-y: auto;">
                                        ${investigadoresHtml}
                                    </div>
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

    static mostrarFormulario(semillero = null) {
        if (!AuthManager.isAuthenticated()) {
            Swal.fire('Error', 'Acceso denegado', 'error');
            return;
        }

        // Cargar investigadores para el select
        const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        let investigadoresOptions = '';

        if (investigadores.length === 0) {
            investigadoresOptions = '<div class="alert alert-warning p-2"><small>No hay investigadores creados. <a href="Investigadores.html">Crear uno</a></small></div>';
        } else {
            investigadoresOptions = '<div class="border rounded p-2" style="max-height: 150px; overflow-y: auto;">';
            investigadores.forEach(inv => {
                const isChecked = semillero?.investigadoresIds?.includes(inv.id.toString()) ? 'checked' : '';
                investigadoresOptions += `
                    <div class="form-check">
                        <input class="form-check-input investigador-checkbox" type="checkbox" value="${inv.id}" id="inv_${inv.id}" ${isChecked}>
                        <label class="form-check-label d-flex align-items-center" for="inv_${inv.id}">
                            <img src="${inv.foto || 'https://via.placeholder.com/20'}" class="rounded-circle me-2" style="width: 20px; height: 20px; object-fit: cover;">
                            ${inv.nombre}
                        </label>
                    </div>
                `;
            });
            investigadoresOptions += '</div>';
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
                                <input type="hidden" id="logoUrlExisting" value="${semillero?.logo || ''}">
                                
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
                                        <label>Responsable</label>
                                    </div>
                                </div>

                                <div class="col-md-12">
                                    <div class="form-floating">
                                        <input type="text" class="form-control" id="unidadAcademica" required value="${semillero?.unidadAcademica || ''}">
                                        <label>Unidad Académica</label>
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

                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Logo del Semillero</label>
                                    <input type="file" class="form-control" id="logoFile" accept="image/*">
                                    <div class="mt-2 text-center ${!semillero?.logo ? 'd-none' : ''}" id="previewContainer">
                                        <img src="${semillero?.logo || ''}" id="logoPreview" class="rounded shadow-sm" style="max-height: 100px;">
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Investigadores Asociados</label>
                                    ${investigadoresOptions}
                                    <small class="text-muted">Seleccione los investigadores que pertenecen a este semillero.</small>
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

        const modalAnterior = document.getElementById('semilleroModal');
        if (modalAnterior) modalAnterior.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Listener para preview de imagen
        const fileInput = document.getElementById('logoFile');
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const img = document.getElementById('logoPreview');
                    img.src = evt.target.result;
                    document.getElementById('previewContainer').classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        });

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
        const fileInput = document.getElementById('logoFile');
        const existingLogo = document.getElementById('logoUrlExisting').value;

        // Recopilar IDs de investigadores seleccionados
        const selectedInvestigadores = Array.from(document.querySelectorAll('.investigador-checkbox:checked'))
            .map(cb => cb.value);

        const procesarGuardado = (logoUrl) => {
            const semillero = {
                id: semilleroId || Date.now(),
                nombre: document.getElementById('nombre').value,
                codigo: document.getElementById('codigo').value,
                responsable: document.getElementById('responsable').value,
                unidadAcademica: document.getElementById('unidadAcademica').value,
                acronimo: document.getElementById('acronimo').value,
                fechaCreacion: document.getElementById('fechaCreacion').value,
                logo: logoUrl,
                estado: document.getElementById('estado').value,
                investigadoresIds: selectedInvestigadores // Nuevo campo relation
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

            if (this.activeModal) this.activeModal.hide();
            this.cargarSemilleros();
            Swal.fire('Guardado', 'Semillero guardado correctamente', 'success');
        };

        // Manejo de archivo o URL existente
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                procesarGuardado(e.target.result); // Base64
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            // Si no hay archivo nuevo, usar el existente o placeholder
            procesarGuardado(existingLogo || 'https://via.placeholder.com/150');
        }
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
            title: '¿Está seguro de eliminar el semillero?',
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
            Swal.fire('¡Eliminado!', 'El semillero ha sido eliminado.', 'success');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => SemillerosApp.init());
window.SemillerosApp = SemillerosApp;
