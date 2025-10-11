<?php
session_start();
require_once 'config.php';
header('Content-Type: application/json');

// Verificar si el usuario está autenticado
function isAuthenticated() {
    return isset($_SESSION['user_id']);
}

// Manejar la solicitud según el método HTTP
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($method) {
    case 'POST':
        if ($action === 'login') {
            login();
        } elseif ($action === 'logout') {
            logout();
        } elseif (isAuthenticated()) {
            if ($action === 'create' || $action === 'update') {
                handleInvestigador();
            }
        }
        break;

    case 'GET':
        if ($action === 'list') {
            getInvestigadores();
        }
        break;

    case 'DELETE':
        if (isAuthenticated() && $action === 'delete') {
            deleteInvestigador();
        }
        break;
}

function login() {
    global $conn;
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $stmt = $conn->prepare("SELECT id, password FROM usuarios WHERE username = ?");
        $stmt->execute([$data['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($data['password'], $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Credenciales inválidas']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error en el servidor']);
    }
}

function logout() {
    session_destroy();
    echo json_encode(['success' => true]);
}

function handleInvestigador() {
    global $conn;
    $data = $_POST;
    $id = isset($data['id']) ? $data['id'] : null;

    // Validar campos requeridos
    if (empty($data['nombre']) || empty($data['correo']) || empty($data['area'])) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
        return;
    }

    // Validar y procesar la imagen
    if (isset($_FILES['foto'])) {
        $foto = $_FILES['foto'];
        if ($foto['error'] !== 0) {
            echo json_encode(['success' => false, 'message' => 'La foto es obligatoria']);
            return;
        }

        // Validar tipo de archivo
        $allowed = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($foto['type'], $allowed)) {
            echo json_encode(['success' => false, 'message' => 'Tipo de archivo no permitido']);
            return;
        }

        // Convertir imagen a base64
        $imageData = base64_encode(file_get_contents($foto['tmp_name']));
        $src = 'data:' . $foto['type'] . ';base64,' . $imageData;
    } else {
        echo json_encode(['success' => false, 'message' => 'La foto es obligatoria']);
        return;
    }

    try {
        if ($id) {
            // Actualizar
            $stmt = $conn->prepare("UPDATE investigadores SET nombre = ?, correo = ?, area = ?, foto = ? WHERE id = ?");
            $stmt->execute([$data['nombre'], $data['correo'], $data['area'], $src, $id]);
        } else {
            // Crear nuevo
            $stmt = $conn->prepare("INSERT INTO investigadores (nombre, correo, area, foto) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data['nombre'], $data['correo'], $data['area'], $src]);
        }
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error al guardar los datos']);
    }
}

function getInvestigadores() {
    global $conn;
    try {
        $stmt = $conn->query("SELECT * FROM investigadores ORDER BY nombre");
        $investigadores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $investigadores]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error al obtener los datos']);
    }
}

function deleteInvestigador() {
    global $conn;
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'ID no proporcionado']);
        return;
    }

    try {
        $stmt = $conn->prepare("DELETE FROM investigadores WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error al eliminar el investigador']);
    }
}
