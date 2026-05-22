<?php
// Invitation Builder — PHP storage API
// Stores invitations as JSON files in ./data/<slug>.json
// Endpoints (single entry point, dispatched by ?action and method):
//   GET  /api/index.php?action=health           → { ok: true }
//   GET  /api/index.php?id=<slug>               → Invitation JSON
//   PUT  /api/index.php?id=<slug>   (body=JSON) → stored Invitation
//   POST /api/index.php?id=<slug>   (body=JSON) → stored Invitation (alias of PUT)
//   DELETE /api/index.php?id=<slug>             → { ok: true }

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';
$id     = isset($_GET['id']) ? $_GET['id'] : '';

function bail($code, $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

if ($action === 'health') {
    echo json_encode(['ok' => true, 'service' => 'invitation-builder-php']);
    exit;
}

// Sanitize slug: allow [A-Za-z0-9_-], 1..64 chars
if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id)) {
    bail(400, 'Invalid id');
}

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    if (!@mkdir($dataDir, 0755, true) && !is_dir($dataDir)) {
        bail(500, 'Cannot create data dir');
    }
}
// Protect from direct browsing
$htaccess = $dataDir . '/.htaccess';
if (!file_exists($htaccess)) {
    @file_put_contents($htaccess, "Require all denied\n");
}

$file = $dataDir . '/' . $id . '.json';

switch ($method) {
    case 'GET':
        if (!file_exists($file)) bail(404, 'Not found');
        readfile($file);
        exit;

    case 'PUT':
    case 'POST':
        $raw = file_get_contents('php://input');
        if (!$raw) bail(400, 'Empty body');
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) bail(400, 'Invalid JSON');
        if (strlen($raw) > 2 * 1024 * 1024) bail(413, 'Payload too large');
        $tmp = $file . '.tmp';
        if (file_put_contents($tmp, $raw, LOCK_EX) === false) bail(500, 'Write failed');
        if (!rename($tmp, $file)) { @unlink($tmp); bail(500, 'Rename failed'); }
        echo $raw;
        exit;

    case 'DELETE':
        if (file_exists($file)) @unlink($file);
        echo json_encode(['ok' => true]);
        exit;

    default:
        bail(405, 'Method not allowed');
}
