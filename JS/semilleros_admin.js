// Gestión de semilleros para administradores
class SemilleroManager {
    static async createSemillero(data) {
        if (!AuthManager.isAuthenticated()) {
            throw new Error('No autorizado');
        }

        try {
            const response = await fetch('php/api_new.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'createSemillero',
                    data: data
                })
            });

            const result = await response.json();
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error al crear semillero:', error);
            throw error;
        }
    }

    static showCreateForm() {
        const modal = document.getElementById('createSemilleroModal');
        if (!modal) {
            this.createModal();
        }
        const modalInstance = new bootstrap.Modal(document.getElementById('createSemilleroModal'));
        modalInstance.show();
    }

    static createModal() {
        const modalHtml = `
            <div class="modal fade" id="createSemilleroModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Crear Nuevo Semillero</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="semilleroForm">
                                <div class="mb-3">
                                    <label class="form-label">Código del semillero:</label>
                                    <input type="text" class="form-control" name="codigo" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Nombre del semillero:</label>
                                    <input type="text" class="form-control" name="nombre" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Responsable:</label>
                                    <input type="text" class="form-control" name="responsable" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Unidad académica:</label>
                                    <input type="text" class="form-control" name="unidad" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Fecha de creación:</label>
                                    <input type="date" class="form-control" name="fecha" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" onclick="SemilleroManager.handleCreate()">Crear</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    static async handleCreate() {
        const form = document.getElementById('semilleroForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await this.createSemillero(data);
            // Cerrar modal y actualizar lista
            const modal = bootstrap.Modal.getInstance(document.getElementById('createSemilleroModal'));
            modal.hide();
            // Recargar la lista de semilleros
            loadSemilleros();
        } catch (error) {
            alert('Error al crear el semillero: ' + error.message);
        }
    }
}
