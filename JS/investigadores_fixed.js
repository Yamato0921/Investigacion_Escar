// Datos iniciales de investigadores
const investigadoresIniciales = [
    {
        id: 1,
        nombre: "Juan Pérez",
        correo: "juan.perez@escar.edu.co",
        area: "Tecnología",
        foto: "Src/Images/investigador1.jpg"
    },
    {
        id: 2,
        nombre: "María García",
        correo: "maria.garcia@escar.edu.co",
        area: "Ciencias",
        foto: "Src/Images/investigador2.jpg"
    },
    {
        id: 3,
        nombre: "Carlos Rodríguez",
        correo: "carlos.rodriguez@escar.edu.co",
        area: "Humanidades",
        foto: "Src/Images/investigador3.jpg"
    }
];

// Datos de usuario admin
const adminUser = {
    username: "admin",
    password: "admin123"
};

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

    // Verificar sesión
    checkSession() {
        const session = localStorage.getItem('session');
        if (session === 'active') {
            this.isAdmin = true;
            this.updateAdminUI();
        } else {
            this.isAdmin = false;
            this.updateAdminUI();
        }
    },

    // Login
    login(username, password) {
        if (username === adminUser.username && password === adminUser.password) {
            localStorage.setItem('session', 'active');
            this.isAdmin = true;
            this.updateAdminUI();
            return true;
        }
        return false;
    },

    // Logout
    logout() {
        localStorage.removeItem('session');
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
        
        if (this.isAdmin) {
            adminControls.classList.remove('d-none');
            adminButtons.forEach(el => el.classList.remove('d-none'));
            this.loginButton.innerHTML = '<i class="bi bi-box-arrow-right"></i> Cerrar Sesión';
            this.loginButton.setAttribute('data-bs-target', '');
            this.loginButton.onclick = () => this.logout();
        } else {
            adminControls.classList.add('d-none');
            adminButtons.forEach(el => el.classList.add('d-none'));
            this.loginButton.innerHTML = '<i class="bi bi-person"></i> Iniciar Sesión';
            this.loginButton.setAttribute('data-bs-target', '#loginModal');
            this.loginButton.onclick = null;
        }
    },

    // Guardar investigador
    guardarInvestigador(formData) {
        const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        const newInvestigador = {
            id: this.currentEditId || Date.now(),
            nombre: formData.get('nombre'),
            correo: formData.get('correo'),
            area: formData.get('area'),
            foto: ''
        };

        // Manejar la foto
        const fotoFile = formData.get('foto');
        if (fotoFile instanceof File && fotoFile.size > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                newInvestigador.foto = e.target.result;
                this.saveInvestigadorData(investigadores, newInvestigador);
            };
            reader.readAsDataURL(fotoFile);
        } else if (this.currentEditId) {
            // Mantener la foto existente en caso de edición
            const existingInvestigador = investigadores.find(i => i.id === this.currentEditId);
            if (existingInvestigador) {
                newInvestigador.foto = existingInvestigador.foto;
            }
            this.saveInvestigadorData(investigadores, newInvestigador);
        }

        return true;
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

    // Editar investigador
    editarInvestigador(id) {
        const investigadores = JSON.parse(localStorage.getItem('investigadores') || '[]');
        const investigador = investigadores.find(i => i.id === id);
        
        if (investigador) {
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
