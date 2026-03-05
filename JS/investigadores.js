const InvestigadoresApp = {
    API_URL: 'php/api_mongo.php',
    isAdmin: false,
    currentEditId: null,
    modalInstance: null,

    init() {
        console.log('InvestigadoresApp Init (API Mode)');

        const modalEl = document.getElementById('addInvestigadorModal');
        if (modalEl) {
            this.modalInstance = new bootstrap.Modal(modalEl);
        }

        this.checkSession();
        this.loadInvestigadores();
        this.setupEventListeners();
    },

    getAuthHeaders(isFormData = false) {
        const headers = {};
        if (!isFormData) headers['Content-Type'] = 'application/json';
        const token = localStorage.getItem('escar_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    },

    async checkSession() {
        // Aprovechamos que auth.js maneja la sesión básica, 
        // pero verificamos permisos de admin contra el API si es necesario
        this.isAdmin = (typeof AuthManager !== 'undefined') ? AuthManager.isAuthenticated() : false;
        this.updateAdminUI();
    },

    async loadInvestigadores() {
        const grid = document.getElementById('investigadoresGrid');
        try {
            const response = await fetch(`${this.API_URL}?action=list`);
            const data = await response.json();

            if (data.success) {
                this.renderUI(data.data);
            } else {
                console.error('Error del API:', data.message);
                this.renderUI([]); // Mostrar vacío si falla
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            Swal.fire('Error', 'No se pudo conectar con el servidor de base de datos.', 'error');
        }
    },

    renderUI(investigadores) {
        const grid = document.getElementById('investigadoresGrid');
        if (!grid) return;

        grid.innerHTML = '';

        if (!investigadores || investigadores.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center my-5 animate__animated animate__fadeIn"><h3 class="text-muted">No se encontraron investigadores en la base de datos</h3></div>';
            return;
        }

        investigadores.forEach(inv => {
            const id = inv._id || inv.id; // Soporte para mongo _id
            const card = `
                <div class="col-md-6 col-lg-4 mb-4 animate__animated animate__fadeIn">
                    <div class="card h-100 shadow-sm border-0 overflow-hidden hover-card">
                        <div class="investigador-img-container position-relative" style="height: 350px; overflow: hidden;">
                            <img src="${inv.foto || 'https://via.placeholder.com/300'}" 
                                 class="position-absolute w-100 h-100" 
                                 alt="${inv.nombre}"
                                 style="object-fit: cover; object-position: center 20%;">
                            <div class="overlay position-absolute bottom-0 w-100 p-3 text-white" style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                                <p class="mb-0 text-warning text-uppercase fw-bold smaller">${inv.grado || 'Investigador'}</p>
                                <h5 class="card-title mb-1 fw-bold">${inv.nombre}</h5>
                                <small><i class="bi bi-briefcase"></i> ${inv.profesion || inv.area}</small>
                            </div>
                        </div>
                        <div class="card-body">
                            <button class="btn btn-outline-primary w-100 mb-2" onclick="InvestigadoresApp.verInvestigador('${id}')">
                                <i class="bi bi-person-lines-fill"></i> Ver Perfil
                            </button>
                            <div class="admin-controls ${this.isAdmin ? '' : 'd-none'}">
                                <button class="btn btn-warning btn-sm w-100 mb-1" onclick="InvestigadoresApp.editarInvestigador('${id}')">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-danger btn-sm w-100" onclick="InvestigadoresApp.eliminarInvestigador('${id}')">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });

        this.updateAdminUI();
    },

    updateAdminUI() {
        const adminElements = document.querySelectorAll('.admin-controls, #adminControls');
        adminElements.forEach(el => {
            if (this.isAdmin) el.classList.remove('d-none');
            else el.classList.add('d-none');
        });
        if (typeof AuthManager !== 'undefined') AuthManager.updateLoginButton();
    },

    mostrarFormulario(investigador = null) {
        if (!this.isAdmin) {
            Swal.fire('Error', 'Acceso denegado. Por favor inicie sesión.', 'error');
            return;
        }

        this.currentEditId = investigador ? (investigador._id || investigador.id) : null;

        document.getElementById('modalTitle').textContent = investigador ? 'Editar Investigador' : 'Nuevo Investigador';
        document.getElementById('nombreInvestigador').value = investigador ? investigador.nombre : '';
        document.getElementById('gradoInvestigador').value = investigador ? (investigador.grado || '') : '';
        document.getElementById('profesionInvestigador').value = investigador ? (investigador.profesion || '') : '';
        document.getElementById('telefonoInvestigador').value = investigador ? (investigador.telefono || '') : '';
        document.getElementById('correoInvestigador').value = investigador ? investigador.correo : '';
        document.getElementById('areaInvestigador').value = investigador ? investigador.area : '';

        const preview = document.getElementById('previewImagen');
        if (preview && investigador?.foto) {
            preview.src = investigador.foto;
            preview.classList.remove('d-none');
        } else if (preview) {
            preview.classList.add('d-none');
        }

        if (this.modalInstance) this.modalInstance.show();
    },

    async guardarInvestigador() {
        const form = document.getElementById('investigadorForm');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const formData = new FormData(form);
        if (this.currentEditId) {
            formData.append('id', this.currentEditId);
        }

        Swal.fire({
            title: 'Guardando...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        try {
            const action = this.currentEditId ? 'update' : 'create';
            const response = await fetch(`${this.API_URL}?action=${action}`, {
                method: 'POST',
                body: formData,
                headers: this.getAuthHeaders(true)
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire('¡Éxito!', 'Los datos se han guardado en MongoDB Atlas.', 'success');
                if (this.modalInstance) this.modalInstance.hide();
                await this.loadInvestigadores();
                form.reset();
                form.classList.remove('was-validated');
            } else {
                throw new Error(data.message || 'Error desconocido al guardar');
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            Swal.fire('Error', 'No se pudo guardar: ' + error.message, 'error');
        }
    },

    async editarInvestigador(id) {
        try {
            const response = await fetch(`${this.API_URL}?action=get&id=${id}`);
            const data = await response.json();
            if (data.success) {
                this.mostrarFormulario(data.data);
            } else {
                Swal.fire('Error', 'No se pudo cargar la información del investigador.', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión con el servidor.', 'error');
        }
    },

    async eliminarInvestigador(id) {
        const result = await Swal.fire({
            title: '¿Eliminar investigador?',
            text: "Se borrará permanentemente de MongoDB Atlas",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${this.API_URL}?action=delete&id=${id}`, {
                    method: 'POST', // Usamos POST ya que algunos hostings bloquean DELETE
                    headers: this.getAuthHeaders(true)
                });
                const data = await response.json();
                if (data.success) {
                    Swal.fire('Eliminado', 'El registro ha sido borrado de la base de datos.', 'success');
                    await this.loadInvestigadores();
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
            }
        }
    },

    async verInvestigador(id) {
        try {
            const response = await fetch(`${this.API_URL}?action=get&id=${id}`);
            const data = await response.json();
            if (!data.success) return;

            const investigador = data.data;
            const modalHtml = `
                <div class="modal fade" id="perfilModal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content border-0 overflow-hidden">
                            <div class="modal-header border-0 p-0 position-relative" style="height: 150px; background-color: #fceda4;">
                                <button type="button" class="btn-close position-absolute top-0 end-0 m-3" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body text-center pt-0 position-relative">
                                <div class="position-absolute start-50 translate-middle-x" style="top: -60px;">
                                    <img src="${investigador.foto || 'https://via.placeholder.com/300'}" 
                                         class="rounded-circle border border-4 border-white shadow" 
                                         alt="${investigador.nombre}"
                                         style="width: 120px; height: 120px; object-fit: cover; background-color: white;">
                                </div>
                                <div style="margin-top: 70px;">
                                    <div class="badge bg-primary mb-2">${investigador.grado || 'Investigador'}</div>
                                    <h3 class="fw-bold mb-1">${investigador.nombre}</h3>
                                    <p class="text-muted fw-bold mb-1">${investigador.profesion || ''}</p>
                                    <p class="text-muted mb-3">${investigador.area}</p>
                                    <div class="row justify-content-center g-2 mt-3">
                                        <div class="col-auto"><p class="text-primary mb-0"><i class="bi bi-envelope-fill me-2"></i>${investigador.correo}</p></div>
                                        <div class="col-auto"><p class="text-secondary mb-0"><i class="bi bi-telephone-fill me-2"></i>${investigador.telefono || 'Sin teléfono'}</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const oldModal = document.getElementById('perfilModal');
            if (oldModal) oldModal.remove();
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            new bootstrap.Modal(document.getElementById('perfilModal')).show();
        } catch (error) {
            console.error('Error al ver perfil:', error);
        }
    },

    setupEventListeners() {
        const form = document.getElementById('investigadorForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarInvestigador();
            });
        }

        const fileInput = document.getElementById('fotoInvestigador');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const img = document.getElementById('previewImagen');
                        if (img) {
                            img.src = evt.target.result;
                            img.classList.remove('d-none');
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => InvestigadoresApp.init());
window.InvestigadoresApp = InvestigadoresApp;
