// Datos iniciales de investigadores (Legacy Fallback)
const investigadoresIniciales = [
    {
        id: 1,
        nombre: "Juan Pérez",
        correo: "juan.perez@escar.edu.co",
        area: "Tecnología",
        foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    }
];

const InvestigadoresApp = {
    isAdmin: false,
    currentEditId: null,
    modalInstance: null,

    init() {
        console.log('InvestigadoresApp Init (Enhanced)');
        this.initializeData();

        const modalEl = document.getElementById('addInvestigadorModal');
        if (modalEl) {
            this.modalInstance = new bootstrap.Modal(modalEl);
        }

        // Inicializar Auth y botones
        if (typeof AuthManager !== 'undefined') {
            AuthManager.init();
        }

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.iniciarSesion(e));
        }

        this.checkSession();
        this.loadInvestigadores();
        this.setupEventListeners();
    },

    iniciarSesion(e) {
        e.preventDefault();
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (AuthManager.login(email, password)) {
            // Cerrar modal si está abierto
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
    },

    initializeData() {
        if (!localStorage.getItem('investigadores')) {
            localStorage.setItem('investigadores', JSON.stringify(investigadoresIniciales));
        }
    },

    loadInvestigadores() {
        const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        this.renderUI(investigadores);
    },

    renderUI(investigadores) {
        const grid = document.getElementById('investigadoresGrid');
        if (!grid) return;

        // Asegurar que el grid sea visible
        grid.classList.add('is-visible');
        grid.classList.remove('fade-in-section');

        grid.innerHTML = '';

        if (investigadores.length === 0) {
            grid.innerHTML = '<div class="col-12 text-center my-5 animate__animated animate__fadeIn"><h3 class="text-muted">No se encontraron investigadores</h3></div>';
            return;
        }

        investigadores.forEach(inv => {
            const card = `
                <div class="col-md-6 col-lg-4 mb-4 animate__animated animate__fadeIn">
                    <div class="card h-100 shadow-sm border-0 overflow-hidden hover-card">
                        <div class="investigador-img-container position-relative" style="height: 350px; overflow: hidden;">
                            <img src="${inv.foto || 'https://via.placeholder.com/300'}" 
                                 class="position-absolute w-100 h-100" 
                                 alt="${inv.nombre}"
                                 style="object-fit: cover; object-position: center 20%;">
                            <div class="overlay position-absolute bottom-0 w-100 p-3 text-white" style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
                                <h5 class="card-title mb-1">${inv.nombre}</h5>
                                <small><i class="bi bi-bookmark-fill"></i> ${inv.area}</small>
                            </div>
                        </div>
                        <div class="card-body">
                            <button class="btn btn-outline-primary w-100 mb-2" onclick="InvestigadoresApp.verInvestigador(${inv.id})">
                                <i class="bi bi-person-lines-fill"></i> Ver Perfil
                            </button>
                            <div class="admin-controls d-none">
                                <button class="btn btn-warning btn-sm w-100 mb-1" onclick="InvestigadoresApp.editarInvestigador(${inv.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-danger btn-sm w-100" onclick="InvestigadoresApp.eliminarInvestigador(${inv.id})">
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

    checkSession() {
        this.isAdmin = (typeof AuthManager !== 'undefined') ? AuthManager.isAuthenticated() : false;
        this.updateAdminUI();
    },

    updateAdminUI() {
        const adminElements = document.querySelectorAll('.admin-controls, #adminControls');

        if (this.isAdmin) {
            adminElements.forEach(el => el.classList.remove('d-none'));
        } else {
            adminElements.forEach(el => el.classList.add('d-none'));
        }

        if (typeof AuthManager !== 'undefined') AuthManager.updateLoginButton();
    },

    mostrarFormulario(investigador = null) {
        if (!this.isAdmin) {
            Swal.fire('Error', 'Acceso denegado', 'error');
            return;
        }

        this.currentEditId = investigador ? investigador.id : null;

        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = investigador ? 'Editar Investigador' : 'Nuevo Investigador';

        const nombreInput = document.getElementById('nombreInvestigador');
        const correoInput = document.getElementById('correoInvestigador');
        const areaInput = document.getElementById('areaInvestigador');
        const preview = document.getElementById('previewImagen');

        if (nombreInput) nombreInput.value = investigador ? investigador.nombre : '';
        if (correoInput) correoInput.value = investigador ? investigador.correo : '';
        if (areaInput) areaInput.value = investigador ? investigador.area : '';

        if (preview && investigador?.foto) {
            preview.src = investigador.foto;
            preview.classList.remove('d-none');
        } else if (preview) {
            preview.classList.add('d-none');
            preview.src = '';
        }

        const fileInput = document.getElementById('fotoInvestigador');
        if (fileInput) fileInput.value = '';

        if (this.modalInstance) this.modalInstance.show();
    },

    guardarInvestigador() {
        const nombre = document.getElementById('nombreInvestigador').value;
        const correo = document.getElementById('correoInvestigador').value;
        const area = document.getElementById('areaInvestigador').value;

        if (!nombre || !correo || !area) return;

        const fileInput = document.getElementById('fotoInvestigador');

        let fotoFinal = 'https://via.placeholder.com/300';
        if (this.currentEditId) {
            const actual = JSON.parse(localStorage.getItem('investigadores') || '[]').find(i => i.id == this.currentEditId);
            if (actual) fotoFinal = actual.foto;
        }

        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this._guardarData(nombre, correo, area, e.target.result);
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            this._guardarData(nombre, correo, area, fotoFinal);
        }
    },

    _guardarData(nombre, correo, area, foto) {
        let investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        const nuevo = {
            id: this.currentEditId || Date.now(),
            nombre, correo, area, foto
        };

        if (this.currentEditId) {
            const idx = investigadores.findIndex(i => i.id == this.currentEditId);
            if (idx !== -1) investigadores[idx] = nuevo;
        } else {
            investigadores.push(nuevo);
        }

        localStorage.setItem('investigadores', JSON.stringify(investigadores));

        if (this.modalInstance) this.modalInstance.hide();
        this.loadInvestigadores();

        const form = document.getElementById('investigadorForm');
        if (form) form.reset();
        const preview = document.getElementById('previewImagen');
        if (preview) preview.classList.add('d-none');

        Swal.fire('Guardado', '', 'success');
    },

    editarInvestigador(id) {
        const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        const target = investigadores.find(i => i.id == id);
        if (target) this.mostrarFormulario(target);
    },

    eliminarInvestigador(id) {
        Swal.fire({
            title: '¿Eliminar investigador?',
            text: "No se podrá revertir esta acción",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                let investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
                investigadores = investigadores.filter(i => i.id != id);
                localStorage.setItem('investigadores', JSON.stringify(investigadores));
                this.loadInvestigadores();
                Swal.fire(
                    'Eliminado!',
                    'El investigador ha sido eliminado.',
                    'success'
                );
            }
        });
    },

    verInvestigador(id) {
        const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        const investigador = investigadores.find(i => i.id == id);
        if (!investigador) return;

        const modalHtml = `
            <div class="modal fade" id="perfilModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 overflow-hidden">
                        <div class="modal-header border-0 p-0 position-relative" style="height: 150px; background-color: #fceda4;">
                            <button type="button" class="btn-close position-absolute top-0 end-0 m-3" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center pt-0 position-relative">
                            <div class="position-absolute start-50 translate-middle-x" style="top: -60px;">
                                <img src="${investigador.foto}" 
                                     class="rounded-circle border border-4 border-white shadow" 
                                     alt="${investigador.nombre}"
                                     style="width: 120px; height: 120px; object-fit: cover; background-color: white;">
                            </div>
                            
                            <div style="margin-top: 70px;">
                                <h3 class="fw-bold mb-1">${investigador.nombre}</h3>
                                <p class="text-muted mb-3">${investigador.area}</p>
                                <p class="text-primary"><i class="bi bi-envelope-fill me-2"></i>${investigador.correo}</p>
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
