const SemillerosApp = {
    API_URL: 'php/api_mongo.php?col=semilleros',
    activeModal: null,
    semillerosOriginales: [],

    async init() {
        console.log('SemillerosApp API Init');
        this.checkSession();
        await this.cargarSemilleros();
        this.setupGlobalListeners();
    },

    checkSession() {
        this.isAdmin = typeof AuthManager !== 'undefined' ? AuthManager.isAuthenticated() : false;
        this.updateAdminControls();
    },

    updateAdminControls() {
        const adminControls = document.querySelectorAll('.admin-controls, #adminControls');
        adminControls.forEach(el => {
            if (this.isAdmin) el.classList.remove('d-none');
            else el.classList.add('d-none');
        });
    },

    async cargarSemilleros() {
        try {
            const response = await fetch(`${this.API_URL}&action=list`);
            const data = await response.json();
            if (data.success) {
                this.semillerosOriginales = data.data;
                this.renderUI(data.data);
            }
        } catch (error) {
            console.error('Error cargando semilleros:', error);
        }
    },

    renderUI(semilleros) {
        const grid = document.getElementById('semillerosGrid');
        if (!grid) return;
        grid.innerHTML = '';

        if (semilleros.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center my-5"><h3 class="text-muted">No hay semilleros registrados</h3></div>';
            return;
        }

        semilleros.forEach(s => {
            const id = s.id;
            const card = `
                <div class="col-md-6 mb-4 animate__animated animate__fadeIn">
                    <div class="card h-100 shadow-sm hover-card">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <img src="${s.logo || 'https://via.placeholder.com/60'}" class="rounded-circle me-3 border" style="width: 60px; height: 60px; object-fit: cover;">
                                <div>
                                    <h5 class="card-title mb-0 text-primary">${s.nombre}</h5>
                                    <small class="text-muted"><i class="bi bi-person-badge"></i> Resp: ${s.responsable}</small>
                                </div>
                            </div>
                            <h6 class="card-subtitle mb-2 text-muted fw-bold">${s.unidadAcademica}</h6>
                            <p class="card-text mb-1"><i class="bi bi-upc-scan"></i> Código: ${s.codigo}</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <span class="badge ${s.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'}">${s.estado || 'ACTIVO'}</span>
                                <small class="text-muted">${s.fechaCreacion}</small>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent border-top-0 pb-3">
                            <button class="btn btn-outline-primary w-100 mb-2" onclick="SemillerosApp.verDetalle('${id}')">
                                <i class="bi bi-eye"></i> Ver Semillero
                            </button>
                            <div class="d-flex justify-content-end gap-2 admin-controls ${this.isAdmin ? '' : 'd-none'}">
                                <button class="btn btn-warning btn-sm flex-grow-1" onclick="SemillerosApp.editarSemillero('${id}')">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-danger btn-sm flex-grow-1" onclick="SemillerosApp.eliminarSemillero('${id}')">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });
    },

    async verDetalle(id) {
        const s = this.semillerosOriginales.find(item => (item.id == id || item._id == id));
        if (!s) return;

        // Mostrar cargando en la zona de integrantes
        let investigadoresHtml = `
            <div class="text-center p-4">
                <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
                <p class="small text-muted mt-2">Cargando integrantes...</p>
            </div>
        `;

        const modalHtml = `
            <div class="modal fade" id="detalleModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header border-0 pb-0 shadow-sm bg-light">
                            <h5 class="modal-title fw-bold text-primary p-2">${s.nombre}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body pt-4">
                            <div class="text-center mb-4">
                                <img src="${s.logo || 'https://via.placeholder.com/120'}" class="rounded-circle shadow-sm border border-4 border-white mb-3" style="width: 120px; height: 120px; object-fit: cover; background: white;">
                                <h2 class="fw-bold text-dark">${s.nombre}</h2>
                                <p class="text-muted mb-0"><i class="bi bi-person-badge"></i> Responsable: ${s.responsable}</p>
                            </div>
                            
                            <div class="px-3">
                                <div class="mb-4 bg-light p-3 rounded-3 border-start border-4 border-primary">
                                    <h5 class="fw-bold mb-2 text-primary"><i class="bi bi-info-circle me-2"></i>Sobre el Semillero</h5>
                                    <p class="text-secondary mb-0" style="white-space: pre-line;">${s.descripcion || 'Sin descripción disponible.'}</p>
                                </div>

                                <div class="row g-3 mb-4">
                                    <div class="col-6 col-md-3">
                                        <div class="p-2 border rounded-3 text-center bg-white shadow-sm">
                                            <small class="d-block text-muted">Unidad</small>
                                            <span class="fw-bold small">${s.unidadAcademica || 'ESCAR'}</span>
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="p-2 border rounded-3 text-center bg-white shadow-sm">
                                            <small class="d-block text-muted">Código</small>
                                            <span class="fw-bold small">${s.codigo}</span>
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="p-2 border rounded-3 text-center bg-white shadow-sm">
                                            <small class="d-block text-muted">Estado</small>
                                            <span class="badge ${s.estado === 'ACTIVO' ? 'bg-success' : 'bg-danger'} d-block mt-1">${s.estado}</span>
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="p-2 border rounded-3 text-center bg-white shadow-sm">
                                            <small class="d-block text-muted">Acrónimo</small>
                                            <span class="fw-bold small">${s.acronimo || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <h5 class="fw-bold border-bottom pb-2 mb-3 text-dark"><i class="bi bi-people-fill me-2"></i>Integrantes Asociados</h5>
                                <div id="listaIntegrantes" class="row g-3 pb-3">
                                    ${investigadoresHtml}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const oldModal = document.getElementById('detalleModal');
        if (oldModal) oldModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalInstance = new bootstrap.Modal(document.getElementById('detalleModal'));
        modalInstance.show();

        // Cargar integrantes reales pasados por ID
        try {
            const selectedIds = s.investigadoresIds ? (typeof s.investigadoresIds === 'string' ? JSON.parse(s.investigadoresIds) : s.investigadoresIds) : [];

            if (selectedIds.length > 0) {
                const resp = await fetch('php/api_mongo.php?col=investigadores&action=list');
                const data = await resp.json();
                if (data.success) {
                    const integrantes = data.data.filter(inv => selectedIds.includes(inv.id || inv._id));
                    const container = document.getElementById('listaIntegrantes');
                    if (integrantes.length > 0) {
                        container.innerHTML = integrantes.map(inv => `
                            <div class="col-md-6">
                                <div class="d-flex align-items-center p-2 border rounded-3 bg-white hover-card shadow-sm" style="transition: transform 0.2s;">
                                    <img src="${inv.foto || 'https://via.placeholder.com/40'}" class="rounded-circle me-2 border" style="width: 40px; height: 40px; object-fit: cover;">
                                    <div>
                                        <p class="mb-0 fw-bold small">${inv.nombre}</p>
                                        <p class="mb-0 text-muted smaller">${inv.grado || 'Investigador'}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        container.innerHTML = '<div class="col-12"><p class="text-muted fst-italic text-center py-3">No hay investigadores asociados visibles.</p></div>';
                    }
                }
            } else {
                document.getElementById('listaIntegrantes').innerHTML = '<div class="col-12"><p class="text-muted fst-italic text-center py-3">Sin integrantes asignados.</p></div>';
            }
        } catch (err) {
            console.error(err);
            document.getElementById('listaIntegrantes').innerHTML = '<div class="col-12"><p class="text-danger small text-center py-3">Error al cargar integrantes.</p></div>';
        }
    },

    async mostrarFormulario(s = null) {
        if (!this.isAdmin) return;

        // Cargar investigadores reales del API para asociar
        const respInv = await fetch('php/api_mongo.php?col=investigadores&action=list');
        const dataInv = await respInv.json();
        const todosInvestigadores = dataInv.success ? dataInv.data : [];

        let invOptions = '';
        const selectedIds = s?.investigadoresIds ? (typeof s.investigadoresIds === 'string' ? JSON.parse(s.investigadoresIds) : s.investigadoresIds) : [];

        todosInvestigadores.forEach(inv => {
            const checked = selectedIds.includes(inv.id || inv._id) ? 'checked' : '';
            invOptions += `
                <div class="col-md-6 mb-2">
                    <div class="form-check p-2 border rounded-2 bg-white h-100">
                        <input class="form-check-input inv-cb ms-1" type="checkbox" value="${inv.id || inv._id}" id="inv_${inv.id || inv._id}" ${checked}>
                        <label class="form-check-label ps-2 small fw-bold d-block" for="inv_${inv.id || inv._id}">
                            ${inv.nombre}
                            <span class="d-block smaller text-muted fw-normal">${inv.grado || ''}</span>
                        </label>
                    </div>
                </div>
            `;
        });

        const modalHtml = `
            <div class="modal fade" id="semilleroModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content border-0 shadow">
                        <form id="semilleroForm">
                            <div class="modal-header bg-dark text-white border-0">
                                <h5 class="modal-title fw-bold"><i class="bi bi-pencil-square me-2"></i>${s ? 'Actualizar' : 'Registrar'} Semillero</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body p-4 row g-3">
                                <input type="hidden" name="id" value="${s?.id || s?._id || ''}">
                                <div class="col-md-12">
                                    <label class="form-label fw-bold">Nombre del Semillero</label>
                                    <input type="text" name="nombre" class="form-control form-control-lg" required value="${s?.nombre || ''}" placeholder="Ej: Semillero de Seguridad Vial">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Responsable</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-white"><i class="bi bi-person"></i></span>
                                        <input type="text" name="responsable" class="form-control" required value="${s?.responsable || ''}" placeholder="Nombre y Grado">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold">Código de Registro</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-white"><i class="bi bi-upc-scan"></i></span>
                                        <input type="text" name="codigo" class="form-control" required value="${s?.codigo || ''}" placeholder="Ej: SEM-2024-001">
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label fw-bold">Unidad Académica</label>
                                    <input type="text" name="unidadAcademica" class="form-control" value="${s?.unidadAcademica || 'ESCAR'}" placeholder="Ej: Dirección de Carabineros">
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label fw-bold text-primary"><i class="bi bi-info-circle me-1"></i>Descripción del Semillero</label>
                                    <textarea name="descripcion" class="form-control" rows="4" placeholder="Escriba los objetivos, visión y alcance del semillero...">${s?.descripcion || ''}</textarea>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold text-primary">Logo / Escudo</label>
                                    <input type="file" name="logo" class="form-control" accept="image/*">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold text-primary">Estado Operativo</label>
                                    <select name="estado" class="form-select">
                                        <option value="ACTIVO" ${s?.estado === 'ACTIVO' ? 'selected' : ''}>Activo</option>
                                        <option value="INACTIVO" ${s?.estado === 'INACTIVO' ? 'selected' : ''}>Inactivo</option>
                                    </select>
                                </div>
                                <div class="col-12 mt-4">
                                    <label class="form-label fw-bold text-primary border-bottom w-100 pb-2 mb-3"><i class="bi bi-people-fill me-2"></i>Asociar Integrantes</label>
                                    <div class="row g-2 border rounded-3 p-3 bg-light" style="max-height:250px; overflow-y:auto;">
                                        ${invOptions || '<div class="col-12 text-center p-3 text-muted">No hay investigadores registrados.</div>'}
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer bg-light border-0 p-4">
                                <button type="button" class="btn btn-link text-muted" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary btn-lg rounded-pill px-5 shadow-sm fw-bold">Guardar en Atlas</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        const old = document.getElementById('semilleroModal');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const form = document.getElementById('semilleroForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.guardarSemillero(form);
        };

        this.activeModal = new bootstrap.Modal(document.getElementById('semilleroModal'));
        this.activeModal.show();
    },

    async guardarSemillero(form) {
        const formData = new FormData(form);
        const action = formData.get('id') ? 'update' : 'create';

        // Agregar investigadores seleccionados
        const ids = Array.from(document.querySelectorAll('.inv-cb:checked')).map(cb => cb.value);
        formData.append('investigadoresIds', JSON.stringify(ids));

        Swal.fire({
            title: 'Sincronizando con Atlas...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            const token = localStorage.getItem('escar_token');
            const resp = await fetch(`${this.API_URL}&action=${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await resp.json();
            if (data.success) {
                Swal.fire('¡Éxito!', 'Los datos se han guardado permanentemente en MongoDB Atlas.', 'success');
                this.activeModal.hide();
                this.cargarSemilleros();
            } else {
                Swal.fire('Error de Guardado', data.message || 'Error desconocido', 'error');
            }
        } catch (e) {
            Swal.fire('Error de Conexión', 'No se pudo contactar con el API de Atlas.', 'error');
        }
    },

    async editarSemillero(id) {
        const s = this.semillerosOriginales.find(item => item.id == id);
        if (s) this.mostrarFormulario(s);
    },

    async eliminarSemillero(id) {
        const result = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true });
        if (result.isConfirmed) {
            const token = localStorage.getItem('escar_token');
            await fetch(`${this.API_URL}&action=delete&id=${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            this.cargarSemilleros();
            Swal.fire('Eliminado', '', 'success');
        }
    },

    setupGlobalListeners() {
        // Nada especial por ahora ya que el botón de "Nuevo" está en el HTML
    }
};

document.addEventListener('DOMContentLoaded', () => SemillerosApp.init());
window.SemillerosApp = SemillerosApp;
