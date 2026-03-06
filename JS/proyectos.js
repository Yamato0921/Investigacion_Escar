const ProyectosApp = {
    API_URL: 'php/api_mongo.php?col=proyectos',
    modalInstance: null,
    proyectosData: [],
    semillerosData: [],
    galeriaBase64: [],

    async init() {
        console.log('ProyectosApp API Init');
        if (typeof AuthManager !== 'undefined') AuthManager.init();

        const modalEl = document.getElementById('proyectoModal');
        if (modalEl) this.modalInstance = new bootstrap.Modal(modalEl);

        await this.cargarSemilleros();
        await this.cargarProyectos();
        this.updateAdminControls();
        this.setupEventListeners();
    },

    async cargarSemilleros() {
        try {
            const resp = await fetch('php/api_mongo.php?col=semilleros&action=list');
            const data = await resp.json();
            if (data.success) {
                this.semillerosData = data.data;
                const select = document.getElementById('semilleroId');
                if (select) {
                    select.innerHTML = '<option value="" selected disabled>Seleccione el semillero ejecutor...</option>';
                    this.semillerosData.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.id || s._id;
                        opt.textContent = s.nombre;
                        select.appendChild(opt);
                    });
                }
            }
        } catch (e) { console.error('Error cargando semilleros:', e); }
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
            const semillero = this.semillerosData.find(s => (s.id == p.semilleroId || s._id == p.semilleroId));
            const card = `
                <div class="col-md-6 col-lg-4 mb-4 animate__animated animate__fadeIn">
                    <div class="card h-100 shadow-sm border-0 hover-card overflow-hidden">
                        <img src="${p.imagen || 'https://via.placeholder.com/400x200'}" class="card-img-top" style="height: 200px; object-fit: cover;">
                        <div class="card-body">
                            <span class="badge bg-primary mb-2">${semillero ? semillero.nombre : 'Proyecto Independiente'}</span>
                            <h5 class="card-title fw-bold text-dark">${p.titulo}</h5>
                            <p class="card-text text-muted text-truncate">${p.contenido || p.descripcion || ''}</p>
                        </div>
                        <div class="card-footer bg-white border-0 pb-3">
                            <button class="btn btn-primary w-100 rounded-pill" onclick="ProyectosApp.verDetalle('${p.id || p._id}')">Explorar Proyecto</button>
                        </div>
                        <div class="card-footer bg-light admin-controls ${typeof AuthManager !== 'undefined' && AuthManager.isAuthenticated() ? '' : 'd-none'}">
                            <div class="d-flex gap-2">
                                <button class="btn btn-warning btn-sm flex-fill" onclick="ProyectosApp.editarProyecto('${p.id || p._id}')"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-danger btn-sm flex-fill" onclick="ProyectosApp.eliminarProyecto('${p.id || p._id}')"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });
    },

    mostrarModal(p = null) {
        if (!this.modalInstance) return;

        const form = document.getElementById('proyectoForm');
        form.reset();
        this.galeriaBase64 = [];
        document.getElementById('galeriaPreview').innerHTML = '';
        document.getElementById('previewContainer').classList.add('d-none');

        if (p) {
            document.getElementById('proyectoId').value = p.id || p._id;
            document.getElementById('titulo').value = p.titulo;
            document.getElementById('semilleroId').value = p.semilleroId || '';
            document.getElementById('videoUrl').value = p.videoUrl || '';
            document.getElementById('contenido').value = p.contenido || p.descripcion || '';

            if (p.imagen) {
                document.getElementById('imagenPreview').src = p.imagen;
                document.getElementById('previewContainer').classList.remove('d-none');
            }

            if (p.galeria) {
                const gal = typeof p.galeria === 'string' ? JSON.parse(p.galeria) : p.galeria;
                this.galeriaBase64 = gal;
                this.renderGaleriaPreview();
            }
        }
        this.modalInstance.show();
    },

    renderGaleriaPreview() {
        const container = document.getElementById('galeriaPreview');
        container.innerHTML = '';
        this.galeriaBase64.forEach((img, idx) => {
            container.innerHTML += `
                <div class="position-relative">
                    <img src="${img}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;">
                    <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 p-0" 
                        style="width:18px; height:18px; font-size:10px;" onclick="ProyectosApp.quitarDeGaleria(${idx})">×</button>
                </div>
            `;
        });
    },

    quitarDeGaleria(idx) {
        this.galeriaBase64.splice(idx, 1);
        this.renderGaleriaPreview();
    },

    async guardarProyecto() {
        const form = document.getElementById('proyectoForm');
        const formData = new FormData(form);
        const action = formData.get('id') ? 'update' : 'create';

        // Adjuntar galería Base64
        formData.append('galeria', JSON.stringify(this.galeriaBase64));

        Swal.fire({ title: 'Sincronizando con Atlas...', didOpen: () => Swal.showLoading() });

        try {
            const token = localStorage.getItem('escar_token');
            const resp = await fetch(`${this.API_URL}&action=${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await resp.json();
            if (data.success) {
                Swal.fire('¡Éxito!', 'Proyecto y multimedia guardados permanentemente.', 'success');
                this.modalInstance.hide();
                this.cargarProyectos();
            }
        } catch (e) { Swal.fire('Error', 'No se pudo sincronizar.', 'error'); }
    },

    verDetalle(id) {
        const p = this.proyectosData.find(x => (x.id == id || x._id == id));
        if (!p) return;

        const semillero = this.semillerosData.find(s => (s.id == p.semilleroId || s._id == p.semilleroId));

        document.getElementById('lecturaImagen').src = p.imagen || 'https://via.placeholder.com/800x400';
        document.getElementById('lecturaTitulo').textContent = p.titulo;
        document.getElementById('lecturaSemillero').innerHTML = `<i class="bi bi-diagram-3 me-2"></i>Realizado por: ${semillero ? semillero.nombre : 'Proyecto Independiente'}`;
        document.getElementById('lecturaContenido').textContent = p.contenido || p.descripcion || '';

        // Galería
        const galContainer = document.getElementById('galeriaContenedor');
        const galSec = document.getElementById('seccionGaleria');
        if (p.galeria) {
            const gal = typeof p.galeria === 'string' ? JSON.parse(p.galeria) : p.galeria;
            if (gal.length > 0) {
                galSec.classList.remove('d-none');
                galContainer.innerHTML = gal.map(img => `
                    <div class="col-4 col-md-3">
                        <img src="${img}" class="img-fluid rounded shadow-sm hover-zoom" 
                             style="cursor:pointer; height:80px; width:100%; object-fit:cover;"
                             onclick="ProyectosApp.abrirLightbox('${img}')">
                    </div>
                `).join('');
            } else { galSec.classList.add('d-none'); }
        } else { galSec.classList.add('d-none'); }

        // Video
        const vidSec = document.getElementById('seccionVideo');
        if (p.videoUrl) {
            let embedUrl = p.videoUrl;
            if (embedUrl.includes('youtube.com/watch?v=')) {
                embedUrl = embedUrl.replace('watch?v=', 'embed/');
            } else if (embedUrl.includes('youtu.be/')) {
                embedUrl = embedUrl.replace('youtu.be/', 'youtube.com/embed/');
            }
            document.getElementById('lecturaVideo').src = embedUrl;
            vidSec.classList.remove('d-none');
        } else {
            vidSec.classList.add('d-none');
            document.getElementById('lecturaVideo').src = '';
        }

        new bootstrap.Modal(document.getElementById('lecturaModal')).show();
    },

    abrirLightbox(imgUrl) {
        Swal.fire({
            imageUrl: imgUrl,
            imageAlt: 'Imagen del Proyecto',
            showConfirmButton: false,
            showCloseButton: true,
            width: 'auto',
            padding: '0',
            background: 'transparent',
            customClass: {
                popup: 'border-0 shadow-lg',
                image: 'rounded-4'
            },
            showClass: {
                popup: 'animate__animated animate__zoomIn animate__faster'
            },
            hideClass: {
                popup: 'animate__animated animate__zoomOut animate__faster'
            }
        });
    },

    editarProyecto(id) {
        const p = this.proyectosData.find(x => (x.id == id || x._id == id));
        if (p) this.mostrarModal(p);
    },

    async eliminarProyecto(id) {
        const res = await Swal.fire({ title: '¿Eliminar Proyecto?', text: 'Se borrarán todos los archivos asociados en Atlas.', icon: 'warning', showCancelButton: true });
        if (res.isConfirmed) {
            const token = localStorage.getItem('escar_token');
            await fetch(`${this.API_URL}&action=delete&id=${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            this.cargarProyectos();
            Swal.fire('Eliminado', '', 'success');
        }
    },

    setupEventListeners() {
        const form = document.getElementById('proyectoForm');
        if (form) form.onsubmit = (e) => { e.preventDefault(); this.guardarProyecto(); };

        // Preview Imagen Principal
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

        // Manejo de Galería Múltiple
        const galInput = document.getElementById('galeriaInput');
        if (galInput) galInput.onchange = async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                const b64 = await this.convertToBase64(file);
                if (b64) {
                    this.galeriaBase64.push(b64);
                }
            }
            this.renderGaleriaPreview();
            galInput.value = ''; // Limpiar para permitir volver a subir
        };
    },

    convertToBase64(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => ProyectosApp.init());
window.ProyectosApp = ProyectosApp;

document.addEventListener('DOMContentLoaded', () => ProyectosApp.init());
window.ProyectosApp = ProyectosApp;
