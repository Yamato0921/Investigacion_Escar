// Namespace global para la aplicación
const InvestigadoresApp = {
    API_URL: 'php/api.php',
    isAdmin: false,
    currentEditId: null,

    // Inicialización
    async init() {
        await this.checkSession();
        await this.loadInvestigadores();
        this.setupEventListeners();
    },

    // Cargar investigadores
    async loadInvestigadores() {
        try {
            const response = await fetch(`${this.API_URL}?action=list`);
            const data = await response.json();
            if (data.success) {
                this.renderUI(data.data);
            } else {
                this.showError('Error al cargar investigadores');
            }
        } catch (error) {
            this.showError('Error de conexión');
        }
    },

    // Verificar sesión
    async checkSession() {
        try {
            const response = await fetch(`${this.API_URL}?action=check_session`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                this.isAdmin = true;
                this.updateAdminUI();
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    },

    // Renderizar UI
    renderUI(investigadores) {
        const grid = document.getElementById('investigadoresGrid');
        grid.innerHTML = '';
        
        investigadores.forEach(inv => {
            const card = `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100">
                        <img src="${inv.foto}" class="card-img-top" alt="${inv.nombre}"
                             style="height: 250px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${inv.nombre}</h5>
                            <p class="card-text">
                                <i class="bi bi-envelope"></i> ${inv.correo}<br>
                                <i class="bi bi-bookmark"></i> ${inv.area}
                            </p>
                            <div class="admin-controls ${this.isAdmin ? '' : 'd-none'}">
                                <button class="btn btn-warning btn-sm me-2" onclick="InvestigadoresApp.editarInvestigador(${inv.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="InvestigadoresApp.eliminarInvestigador(${inv.id})">
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

    // Configurar event listeners
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!e.target.checkValidity()) {
                e.target.classList.add('was-validated');
                return;
            }

            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch(`${this.API_URL}?action=login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });

                const data = await response.json();
                if (data.success) {
                    this.isAdmin = true;
                    this.updateAdminUI();
                    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
                    e.target.reset();
                    Swal.fire({
                        icon: 'success',
                        title: '¡Bienvenido!',
                        text: 'Has iniciado sesión correctamente',
                        timer: 1500
                    });
                } else {
                    throw new Error(data.message || 'Credenciales incorrectas');
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de inicio de sesión',
                    text: error.message || 'Error al intentar iniciar sesión'
                });
            }
        });

        // Formulario de investigador
        document.getElementById('investigadorForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!e.target.checkValidity()) {
                e.target.classList.add('was-validated');
                return;
            }

            const formData = new FormData(e.target);
            if (this.currentEditId) {
                formData.append('id', this.currentEditId);
            }

            try {
                const response = await fetch(`${this.API_URL}?action=${this.currentEditId ? 'update' : 'create'}`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                const data = await response.json();
                if (data.success) {
                    await this.loadInvestigadores();
                    bootstrap.Modal.getInstance(document.getElementById('addInvestigadorModal')).hide();
                    e.target.reset();
                    e.target.classList.remove('was-validated');
                    document.getElementById('previewImagen').classList.add('d-none');
                    this.currentEditId = null;
                    Swal.fire('¡Éxito!', 'Datos guardados correctamente', 'success');
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al guardar los datos'
                });
            }
        });

        // Preview de imagen
        document.getElementById('fotoInvestigador').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewImagen = document.getElementById('previewImagen');
                    previewImagen.src = e.target.result;
                    previewImagen.classList.remove('d-none');
                };
                reader.readAsDataURL(file);
            }
        });

        // Reset form al cerrar modal
        document.getElementById('addInvestigadorModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('investigadorForm').reset();
            document.getElementById('previewImagen').classList.add('d-none');
            this.currentEditId = null;
            document.querySelector('#addInvestigadorModal .modal-title').textContent = 'Agregar Investigador';
        });
    },

    // Actualizar UI para admin
    updateAdminUI() {
        const adminControls = document.getElementById('adminControls');
        const adminButtons = document.querySelectorAll('.admin-controls');
        const loginButton = document.querySelector('[data-bs-target="#loginModal"]');
        
        if (this.isAdmin) {
            adminControls.classList.remove('d-none');
            adminButtons.forEach(el => el.classList.remove('d-none'));
            loginButton.textContent = 'Cerrar Sesión';
            loginButton.setAttribute('data-bs-target', '');
            loginButton.onclick = () => this.logout();
        } else {
            adminControls.classList.add('d-none');
            adminButtons.forEach(el => el.classList.add('d-none'));
            loginButton.textContent = 'Iniciar Sesión';
            loginButton.setAttribute('data-bs-target', '#loginModal');
            loginButton.onclick = null;
        }
    },

    // Logout
    async logout() {
        try {
            const response = await fetch(`${this.API_URL}?action=logout`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                this.isAdmin = false;
                this.updateAdminUI();
                window.location.reload();
            }
        } catch (error) {
            this.showError('Error al cerrar sesión');
        }
    },

    // Editar investigador
    async editarInvestigador(id) {
        try {
            const response = await fetch(`${this.API_URL}?action=get&id=${id}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                const investigador = data.data;
                this.currentEditId = id;
                document.getElementById('nombreInvestigador').value = investigador.nombre;
                document.getElementById('correoInvestigador').value = investigador.correo;
                document.getElementById('areaInvestigador').value = investigador.area;
                
                const previewImagen = document.getElementById('previewImagen');
                previewImagen.src = investigador.foto;
                previewImagen.classList.remove('d-none');
                
                document.querySelector('#addInvestigadorModal .modal-title')
                    .textContent = 'Editar Investigador';
                new bootstrap.Modal(document.getElementById('addInvestigadorModal')).show();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            this.showError('Error al cargar los datos del investigador');
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
            try {
                const response = await fetch(`${this.API_URL}?action=delete&id=${id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.success) {
                    await this.loadInvestigadores();
                    Swal.fire('Eliminado', 'El investigador ha sido eliminado', 'success');
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                this.showError('Error al eliminar el investigador');
            }
        }
    },

    // Mostrar error
    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    }
};
