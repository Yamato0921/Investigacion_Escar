<?php
require_once 'config.php';

// Configuración de CORS y headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://127.0.0.1:5500');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// Si es una solicitud OPTIONS, terminar aquí
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar si el usuario está autenticado
function isAuthenticated(): bool {
    return isset($_SESSION['user_id']) && isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
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
        } elseif ($action === 'get' && isAuthenticated()) {
            getInvestigador();
        } elseif ($action === 'check_session') {
            checkSession();
        }
        break;

    case 'DELETE':
        if (isAuthenticated() && $action === 'delete') {
            deleteInvestigador();
        }
        break;
}

function login(): void {
    global $conn;
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        return;
    }
    
    try {
        $stmt = $conn->prepare("SELECT id, username, password FROM usuarios WHERE username = ?");
        $stmt->execute([$data['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && $data['password'] === $user['password']) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['is_admin'] = true;
            
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuario o contraseña incorrectos']);
        }
    } catch (PDOException $e) {
        error_log('Error en login: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en el servidor']);
    }
}

function logout(): void {
    // Limpiar y destruir la sesión
    $_SESSION = array();
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time()-42000, '/');
    }
    session_destroy();
    
    echo json_encode(['success' => true]);
}

function checkSession(): void {
    // Asegurarse de que la sesión está activa
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (isAuthenticated()) {
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No autenticado']);
    }
}

function getInvestigadores(): void {
    global $conn;
    try {
        $stmt = $conn->query("SELECT * FROM investigadores ORDER BY nombre");
        $investigadores = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $investigadores]);
    } catch (PDOException $e) {
        error_log('Error en getInvestigadores: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al obtener los datos']);
    }
}

function getInvestigador(): void {
    global $conn;
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID no proporcionado']);
        return;
    }

    try {
        $stmt = $conn->prepare("SELECT * FROM investigadores WHERE id = ?");
        $stmt->execute([$id]);
        $investigador = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($investigador) {
            echo json_encode(['success' => true, 'data' => $investigador]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Investigador no encontrado']);
        }
    } catch (PDOException $e) {
        error_log('Error en getInvestigador: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al obtener el investigador']);
    }
}

function handleInvestigador(): void {
    global $conn;
    
    if (empty($_POST['nombre']) || empty($_POST['correo']) || empty($_POST['area'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
        return;
    }

    $foto = null;
    if (isset($_FILES['foto'])) {
        $imageData = base64_encode(file_get_contents($_FILES['foto']['tmp_name']));
        $foto = 'data:' . $_FILES['foto']['type'] . ';base64,' . $imageData;
    }

    try {
        if (isset($_POST['id'])) {
            // Actualizar
            $stmt = $conn->prepare("UPDATE investigadores SET nombre = ?, correo = ?, area = ?" . 
                                 ($foto ? ", foto = ?" : "") . 
                                 " WHERE id = ?");
            $params = [$_POST['nombre'], $_POST['correo'], $_POST['area']];
            if ($foto) {
                $params[] = $foto;
            }
            $params[] = $_POST['id'];
            $stmt->execute($params);
        } else {
            // Crear nuevo
            if (!$foto) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'La foto es obligatoria para nuevos investigadores']);
                return;
            }
            $stmt = $conn->prepare("INSERT INTO investigadores (nombre, correo, area, foto) VALUES (?, ?, ?, ?)");
            $stmt->execute([$_POST['nombre'], $_POST['correo'], $_POST['area'], $foto]);
        }
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        error_log('Error en handleInvestigador: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al guardar los datos']);
    }
}

function deleteInvestigador(): void {
    global $conn;
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID no proporcionado']);
        return;
    }

    try {
        $stmt = $conn->prepare("DELETE FROM investigadores WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        error_log('Error en deleteInvestigador: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al eliminar el investigador']);
    }
}
