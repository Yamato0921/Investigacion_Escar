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
        const s = this.semillerosOriginales.find(item => item.id == id);
        if (!s) return;

        // Cargar investigadores para mostrar asociados (opcionalmente podrías hacer un fetch)
        let investigadoresHtml = '<p class="text-muted fst-italic">Cargando investigadores...</p>';

        const modalHtml = `
            <div class="modal fade" id="detalleModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">${s.nombre}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <img src="${s.logo || 'https://via.placeholder.com/120'}" class="rounded-circle shadow mb-3" style="width: 120px; height: 120px; object-fit: cover;">
                                <h3>${s.nombre}</h3>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <ul class="list-group list-group-flush">
                                        <li class="list-group-item"><strong>Responsable:</strong> ${s.responsable}</li>
                                        <li class="list-group-item"><strong>Unidad:</strong> ${s.unidadAcademica}</li>
                                        <li class="list-group-item"><strong>Código:</strong> ${s.codigo}</li>
                                        <li class="list-group-item"><strong>Acrónimo:</strong> ${s.acronimo || 'N/A'}</li>
                                        <li class="list-group-item"><strong>Estado:</strong> ${s.estado}</li>
                                    </ul>
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
        new bootstrap.Modal(document.getElementById('detalleModal')).show();
    },

    async mostrarFormulario(s = null) {
        if (!this.isAdmin) return;

        // Cargar investigadores reales del API para asociar
        const respInv = await fetch('php/api_mongo.php?col=investigadores&action=list');
        const dataInv = await respInv.json();
        const todosInvestigadores = dataInv.success ? dataInv.data : [];

        let invOptions = '';
        todosInvestigadores.forEach(inv => {
            const checked = s?.investigadoresIds?.includes(inv.id) ? 'checked' : '';
            invOptions += `
                <div class="form-check">
                    <input class="form-check-input inv-cb" type="checkbox" value="${inv.id}" id="inv_${inv.id}" ${checked}>
                    <label class="form-check-label">${inv.nombre}</label>
                </div>
            `;
        });

        const modalHtml = `
            <div class="modal fade" id="semilleroModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <form id="semilleroForm">
                            <div class="modal-header">
                                <h5 class="modal-title">${s ? 'Editar' : 'Nuevo'} Semillero</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body row g-3">
                                <input type="hidden" name="id" value="${s?.id || ''}">
                                <div class="col-md-12"><label class="form-label">Nombre</label><input type="text" name="nombre" class="form-control" required value="${s?.nombre || ''}"></div>
                                <div class="col-md-6"><label class="form-label">Responsable</label><input type="text" name="responsable" class="form-control" required value="${s?.responsable || ''}"></div>
                                <div class="col-md-6"><label class="form-label">Código</label><input type="text" name="codigo" class="form-control" required value="${s?.codigo || ''}"></div>
                                <div class="col-md-12"><label class="form-label">Unidad Académica</label><input type="text" name="unidadAcademica" class="form-control" value="${s?.unidadAcademica || ''}"></div>
                                <div class="col-md-6"><label class="form-label">Logo</label><input type="file" name="logo" class="form-control"></div>
                                <div class="col-md-6">
                                    <label class="form-label">Estado</label>
                                    <select name="estado" class="form-select"><option value="ACTIVO" ${s?.estado === 'ACTIVO' ? 'selected' : ''}>Activo</option><option value="INACTIVO" ${s?.estado === 'INACTIVO' ? 'selected' : ''}>Inactivo</option></select>
                                </div>
                                <div class="col-12"><label class="form-label">Investigadores Asociados</label><div class="border p-2" style="max-height:150px; overflow-y:auto;">${invOptions}</div></div>
                            </div>
                            <div class="modal-footer">
                                <button type="submit" class="btn btn-primary">Guardar en Atlas</button>
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

        try {
            const token = localStorage.getItem('escar_token');
            const resp = await fetch(`${this.API_URL}&action=${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await resp.json();
            if (data.success) {
                Swal.fire('¡Éxito!', 'Semillero guardado en Atlas.', 'success');
                this.activeModal.hide();
                this.cargarSemilleros();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (e) {
            Swal.fire('Error', 'Error de red', 'error');
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
