const ProyectosApp = {
    API_URL: 'php/api_mongo.php?col=proyectos',
    modalInstance: null,
    proyectosData: [],

    async init() {
        console.log('ProyectosApp API Init');
        if (typeof AuthManager !== 'undefined') AuthManager.init();

        const modalEl = document.getElementById('proyectoModal');
        if (modalEl) this.modalInstance = new bootstrap.Modal(modalEl);

        await this.cargarProyectos();
        this.updateAdminControls();
        this.setupEventListeners();
    },

    updateAdminControls() {
        const isAdmin = typeof AuthManager !== 'undefined' ? AuthManager.isAuthenticated() : false;
        document.querySelectorAll('.admin-controls, #adminControls').forEach(el => {
            if (isAdmin) el.classList.remove('d-none');
            else el.classList.add('d-none');
        });
    },

    async cargarProyectos() {
        try {
            const resp = await fetch(`${this.API_URL}&action=list`);
            const data = await resp.json();
            if (data.success) {
                this.proyectosData = data.data;
                this.renderUI(data.data);
            }
        } catch (e) { console.error('Error cargando proyectos:', e); }
    },

    renderUI(proyectos) {
        const grid = document.getElementById('proyectosGrid');
        if (!grid) return;
        grid.innerHTML = '';

        if (proyectos.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center py-5 text-muted"><h3>No hay proyectos en Atlas.</h3></div>';
            return;
        }

        proyectos.forEach(p => {
            const card = `
                <div class="col-md-6 col-lg-4 mb-4 animate__animated animate__fadeIn">
                    <div class="card h-100 shadow-sm border-0 hover-card">
                        <img src="${p.imagen || 'https://via.placeholder.com/400x200'}" class="card-img-top" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title fw-bold text-primary">${p.titulo}</h5>
                            <p class="card-text text-muted text-truncate">${p.contenido || p.descripcion || ''}</p>
                        </div>
                        <div class="card-footer bg-white border-0 d-flex justify-content-between align-items-center">
                            <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="ProyectosApp.verDetalle('${p.id}')">Leer Más</button>
                        </div>
                        <div class="card-footer bg-light admin-controls ${typeof AuthManager !== 'undefined' && AuthManager.isAuthenticated() ? '' : 'd-none'}">
                            <div class="d-flex gap-2">
                                <button class="btn btn-warning btn-sm flex-fill" onclick="ProyectosApp.editarProyecto('${p.id}')"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-danger btn-sm flex-fill" onclick="ProyectosApp.eliminarProyecto('${p.id}')"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });
    },

    mostrarModal(p = null) {
        if (this.modalInstance) {
            document.getElementById('proyectoId').value = p ? p.id : '';
            document.getElementById('titulo').value = p ? p.titulo : '';
            document.getElementById('contenido').value = p ? (p.contenido || p.descripcion || '') : '';
            if (p && p.imagen) {
                document.getElementById('imagenPreview').src = p.imagen;
                document.getElementById('previewContainer').classList.remove('d-none');
            } else {
                document.getElementById('previewContainer').classList.add('d-none');
            }
            this.modalInstance.show();
        }
    },

    async guardarProyecto() {
        const form = document.getElementById('proyectoForm');
        const formData = new FormData(form);
        const action = formData.get('id') ? 'update' : 'create';

        try {
            const token = localStorage.getItem('escar_token');
            const resp = await fetch(`${this.API_URL}&action=${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await resp.json();
            if (data.success) {
                Swal.fire('Guardado', 'Proyecto sincronizado con Atlas.', 'success');
                this.modalInstance.hide();
                this.cargarProyectos();
            }
        } catch (e) { Swal.fire('Error', 'No se pudo guardar.', 'error'); }
    },

    verDetalle(id) {
        const p = this.proyectosData.find(x => x.id == id);
        if (!p) return;
        const modalEl = document.getElementById('lecturaModal');
        if (modalEl) {
            document.getElementById('lecturaImagen').src = p.imagen || '';
            document.getElementById('lecturaTitulo').textContent = p.titulo;
            document.getElementById('lecturaContenido').textContent = p.contenido || p.descripcion || '';
            new bootstrap.Modal(modalEl).show();
        }
    },

    editarProyecto(id) {
        const p = this.proyectosData.find(x => x.id == id);
        if (p) this.mostrarModal(p);
    },

    async eliminarProyecto(id) {
        const res = await Swal.fire({ title: '¿Eliminar?', icon: 'warning', showCancelButton: true });
        if (res.isConfirmed) {
            const token = localStorage.getItem('escar_token');
            await fetch(`${this.API_URL}&action=delete&id=${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            this.cargarProyectos();
        }
    },

    setupEventListeners() {
        const form = document.getElementById('proyectoForm');
        if (form) form.onsubmit = (e) => { e.preventDefault(); this.guardarProyecto(); };

        const imgInput = document.getElementById('imagen');
        if (imgInput) imgInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    document.getElementById('imagenPreview').src = evt.target.result;
                    document.getElementById('previewContainer').classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        };
    }
};

document.addEventListener('DOMContentLoaded', () => ProyectosApp.init());
window.ProyectosApp = ProyectosApp;
