// Datos iniciales de investigadores
const investigadoresIniciales = [
    {
        id: 1,
        nombre: "Juan Pérez",
        correo: "juan.perez@escar.edu.co",
        area: "Tecnología",
        foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 2,
        nombre: "María García",
        correo: "maria.garcia@escar.edu.co",
        area: "Ciencias",
        foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 3,
        nombre: "Carlos Rodríguez",
        correo: "carlos.rodriguez@escar.edu.co",
        area: "Humanidades",
        foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    }
];



const InvestigadoresApp = {
    isAdmin: false,
    currentEditId: null,
    loginButton: null, // Referencia al botón de login/logout

    // Inicialización
    init() {
        this.initializeData();
        this.loginButton = document.querySelector('[data-bs-target="#loginModal"]');
        this.checkSession();
        this.loadInvestigadores();
        this.setupEventListeners();
        this.checkUrlParams();
    },

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewId = urlParams.get('view');
        if (viewId) {
            setTimeout(() => {
                this.editarInvestigador(viewId, true);
            }, 500);
        }
    },

    // Inicializar datos si no existen
    initializeData() {
        if (!localStorage.getItem('investigadores')) {
            localStorage.setItem('investigadores', JSON.stringify(investigadoresIniciales));
        }
    },

    // Cargar investigadores
    loadInvestigadores() {
        const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        this.renderUI(investigadores);
    },

    // Renderizar UI
    renderUI(investigadores) {
        const grid = document.getElementById('investigadoresGrid');
        grid.innerHTML = '';

        investigadores.forEach(inv => {
            const card = `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 shadow-sm border-0 overflow-hidden hover-card">
                        <div class="investigador-img-container position-relative" style="height: 350px; overflow: hidden;">
                            <img src="${inv.foto}" 
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
                            <div class="admin-controls ${this.isAdmin ? '' : 'd-none'}">
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
    },

    // Verificación de sesión usando AuthManager
    checkSession() {
        this.isAdmin = AuthManager.isAuthenticated();
        this.updateAdminUI();
    },

    // Login usando AuthManager
    login(username, password) {
        if (AuthManager.login(username, password)) {
            this.isAdmin = true;
            this.updateAdminUI();
            return true;
        }
        return false;
    },

    // Logout usando AuthManager
    logout() {
        AuthManager.logout();
        this.isAdmin = false;
        this.updateAdminUI();
        Swal.fire({
            icon: 'success',
            title: 'Sesión cerrada',
            text: 'Has cerrado sesión correctamente',
            timer: 1500
        });
    },

    // Actualizar UI para admin
    updateAdminUI() {
        const adminControls = document.getElementById('adminControls');
        const adminButtons = document.querySelectorAll('.admin-controls');
        const btnLogin = this.loginButton;

        if (this.isAdmin) {
            if (adminControls) adminControls.classList.remove('d-none');
            adminButtons.forEach(el => el.classList.remove('d-none'));
            if (btnLogin) {
                btnLogin.innerHTML = '<i class="bi bi-box-arrow-right"></i> Cerrar Sesión';
                btnLogin.removeAttribute('data-bs-toggle');
                btnLogin.removeAttribute('data-bs-target');
                btnLogin.onclick = (e) => {
                    e.preventDefault();
                    this.logout();
                };
            }
        } else {
            if (adminControls) adminControls.classList.add('d-none');
            adminButtons.forEach(el => el.classList.add('d-none'));
            if (btnLogin) {
                btnLogin.innerHTML = '<i class="bi bi-person"></i> Iniciar Sesión';
                btnLogin.setAttribute('data-bs-toggle', 'modal');
                btnLogin.setAttribute('data-bs-target', '#loginModal');
                btnLogin.onclick = null;
            }
        }
    },

    // Guardar investigador
    guardarInvestigador(formData) {
        // Validar campos obligatorios
        const nombre = formData.get('nombre');
        const correo = formData.get('correo');
        const area = formData.get('area');
        const fotoFile = formData.get('foto');

        // Crear objeto de errores
        const errores = [];

        if (!nombre || nombre.trim() === '') {
            errores.push('El nombre es obligatorio');
        } else if (!/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/.test(nombre)) {
            errores.push('El nombre solo debe contener letras y espacios');
        }

        if (!correo || correo.trim() === '') {
            errores.push('El correo es obligatorio');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            errores.push('El correo no tiene un formato válido');
        }

        if (!area || area.trim() === '') {
            errores.push('Debe seleccionar un área de investigación');
        }

        // Validar foto solo para nuevos investigadores
        if (!this.currentEditId) {
            if (!fotoFile || !(fotoFile instanceof File) || fotoFile.size === 0) {
                errores.push('Debe seleccionar una foto');
            } else {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(fotoFile.type)) {
                    errores.push('La foto debe ser en formato JPG, PNG o GIF');
                }
            }
        }

        // Si hay errores, mostrarlos y retornar false
        if (errores.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                html: errores.map(err => `• ${err}`).join('<br>'),
                confirmButtonText: 'Entendido'
            });
            return false;
        }

        // Si no hay errores, proceder con el guardado
        const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        const newInvestigador = {
            id: this.currentEditId || Date.now(),
            nombre: nombre,
            correo: correo,
            area: area,
            foto: ''
        };

        // Manejar la foto
        if (fotoFile instanceof File && fotoFile.size > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                newInvestigador.foto = e.target.result;
                this.saveInvestigadorData(investigadores, newInvestigador);
                this.showSuccessMessage();
            };
            reader.readAsDataURL(fotoFile);
        } else if (this.currentEditId) {
            // Mantener la foto existente en caso de edición
            const existingInvestigador = investigadores.find(i => i.id === this.currentEditId);
            if (existingInvestigador) {
                newInvestigador.foto = existingInvestigador.foto;
                this.saveInvestigadorData(investigadores, newInvestigador);
                this.showSuccessMessage();
            }
        }

        return true;
    },

    // Mostrar mensaje de éxito
    showSuccessMessage() {
        const action = this.currentEditId ? 'actualizado' : 'agregado';
        Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: `El investigador ha sido ${action} correctamente`,
            timer: 1500
        });
    },

    // Guardar datos del investigador
    saveInvestigadorData(investigadores, newInvestigador) {
        const index = investigadores.findIndex(i => i.id === newInvestigador.id);
        if (index !== -1) {
            investigadores[index] = newInvestigador;
        } else {
            investigadores.push(newInvestigador);
        }
        localStorage.setItem('investigadores', JSON.stringify(investigadores));
        this.loadInvestigadores();
    },

    // Ver investigador (Nuevo Diseño)
    verInvestigador(id) {
        const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        const investigador = investigadores.find(i => i.id == id);
        if (!investigador) return;

        const modalHtml = `
            <div class="modal fade" id="perfilModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 overflow-hidden">
                        <div class="modal-header border-0 p-0 position-relative" style="height: 150px; background-color: #fceda4;"> <!-- Banner Amarillo -->
                            <button type="button" class="btn-close position-absolute top-0 end-0 m-3" data-bs-dismiss="modal"></button>
                            <div class="position-absolute top-50 start-50 translate-middle" style="width: 100%; text-align: center;">
                                <!-- Optional: Icon form background pattern could go here -->
                            </div>
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
                                
                                <div class="card bg-light border-0 p-3 mb-3">
                                    <div class="d-flex align-items-center justify-content-center gap-2 text-primary">
                                        <i class="bi bi-envelope-fill"></i>
                                        <span class="text-dark">${investigador.correo}</span>
                                    </div>
                                </div>

                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary rounded-pill" data-bs-dismiss="modal">
                                        <i class="bi bi-hand-thumbs-up"></i> Contactar
                                    </button>
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
    },

    // Editar o Ver investigador
    editarInvestigador(id, isViewMode = false) {
        if (isViewMode) {
            this.verInvestigador(id);
            return;
        }

        const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        const investigador = investigadores.find(i => i.id == id);

        if (investigador) {
            this.currentEditId = id;
            document.getElementById('nombreInvestigador').value = investigador.nombre;
            document.getElementById('correoInvestigador').value = investigador.correo;
            document.getElementById('areaInvestigador').value = investigador.area;

            const previewImagen = document.getElementById('previewImagen');
            previewImagen.src = investigador.foto;
            previewImagen.classList.remove('d-none');

            document.querySelector('#addInvestigadorModal .modal-title').textContent = 'Editar Investigador';

            const modalElement = document.getElementById('addInvestigadorModal');
            new bootstrap.Modal(modalElement).show();

            // Note: Listener de hidden.bs.modal ya limpia el form
        }
    },

    // Eliminar investigador
    async eliminarInvestigador(id) {
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
            const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
            const newInvestigadores = investigadores.filter(i => i.id !== id);
            localStorage.setItem('investigadores', JSON.stringify(newInvestigadores));
            this.loadInvestigadores();
            Swal.fire('Eliminado', 'El investigador ha sido eliminado', 'success');
        }
    },

    // Búsqueda y filtrado
    filterInvestigadores() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filterArea = document.getElementById('filterSelect').value.toLowerCase();

        const cards = document.querySelectorAll('#investigadoresGrid .card');
        cards.forEach(card => {
            const nombre = card.querySelector('.card-title').textContent.toLowerCase();
            const area = card.querySelector('.bi-bookmark').nextSibling.textContent.toLowerCase();

            const matchesSearch = nombre.includes(searchTerm);
            const matchesFilter = !filterArea || area.includes(filterArea);

            card.closest('.col-md-6').style.display =
                matchesSearch && matchesFilter ? 'block' : 'none';
        });
    },

    // Configurar event listeners
    setupEventListeners() {
        // Login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            if (this.login(username, password)) {
                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
                e.target.reset();
                Swal.fire({
                    icon: 'success',
                    title: '¡Bienvenido!',
                    text: 'Has iniciado sesión correctamente',
                    timer: 1500
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Usuario o contraseña incorrectos'
                });
            }
        });

        // Formulario de investigador
        document.getElementById('investigadorForm').addEventListener('submit', (e) => {
            e.preventDefault();

            if (!e.target.checkValidity()) {
                e.target.classList.add('was-validated');
                return;
            }

            const formData = new FormData(e.target);
            if (this.guardarInvestigador(formData)) {
                bootstrap.Modal.getInstance(document.getElementById('addInvestigadorModal')).hide();
                e.target.reset();
                e.target.classList.remove('was-validated');
                document.getElementById('previewImagen').classList.add('d-none');
                this.currentEditId = null;
                document.querySelector('#addInvestigadorModal .modal-title').textContent = 'Agregar Investigador';
                Swal.fire('¡Éxito!', 'Datos guardados correctamente', 'success');
            }
        });

        // Preview de imagen
        document.getElementById('fotoInvestigador').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewImagen = document.getElementById('previewImagen');
                    previewImagen.src = e.target.result;
                    previewImagen.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        });

        // Reset form al cerrar modal
        document.getElementById('addInvestigadorModal').addEventListener('hidden.bs.modal', () => {
            const form = document.getElementById('investigadorForm');
            form.reset();
            form.classList.remove('was-validated');
            document.getElementById('previewImagen').classList.add('d-none');
            this.currentEditId = null;
            document.querySelector('#addInvestigadorModal .modal-title').textContent = 'Agregar Investigador';
        });

        // Búsqueda y filtrado
        document.getElementById('searchInput').addEventListener('input', () => this.filterInvestigadores());
        document.getElementById('filterSelect').addEventListener('change', () => this.filterInvestigadores());
    }
};

// Iniciar la aplicación cuando el documento esté listo
document.addEventListener('DOMContentLoaded', () => InvestigadoresApp.init());
