<?php
/**
 * "Coming soon" gate (only deployed when the site is built with PUBLIC_COMING_SOON=true).
 *
 * .htaccess sends every page request here. Visitors and bots get the coming soon page;
 * after the correct password a signed cookie is set and this script serves the real static files.
 *
 * Password: 'preview_password' in krojacka-config.php (one level above httpdocs).
 * Without it, the built-in default below is used (only its bcrypt hash is in Git).
 */

declare(strict_types=1);

const DEFAULT_PASSWORD_HASH = '$2y$10$bMUK.hMpUPf834JAYo3QwuQpIjZQPc8flWrDakFk1r8u1zT3pfbjm';
const COOKIE = 'kr_preview';

$configFile = dirname(__DIR__) . '/krojacka-config.php';
$config = is_file($configFile) ? require $configFile : [];
$password = (string)($config['preview_password'] ?? '');
$key = (string)($config['preview_secret'] ?? '') ?: hash('sha256', ($password ?: DEFAULT_PASSWORD_HASH) . __DIR__);
$token = hash_hmac('sha256', 'preview-ok', $key);

$root = __DIR__;
$https = ($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';

header('X-Robots-Tag: noindex, nofollow');

function comingSoon(string $root, bool $error = false, string $next = '/'): void
{
    http_response_code(200);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    $html = (string)@file_get_contents($root . '/uskoro/index.html');
    if ($error) {
        $html = str_replace(
            ['data-gate-error hidden', 'data-gate-details', 'value="/" data-gate-next'],
            ['data-gate-error', 'data-gate-details open', 'value="' . htmlspecialchars($next, ENT_QUOTES) . '" data-gate-next'],
            $html
        );
    }
    echo $html ?: 'Uskoro.';
    exit;
}

// Password form
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['password'])) {
    $given = (string)$_POST['password'];
    $next = (string)($_POST['next'] ?? '/');
    if (!preg_match('#^/(?!/)#', $next) || str_contains($next, '\\') || str_starts_with($next, '/gate.php')) {
        $next = '/';
    }
    $ok = $password !== '' ? hash_equals($password, $given) : password_verify($given, DEFAULT_PASSWORD_HASH);
    if (!$ok) {
        usleep(400000);
        comingSoon($root, true, $next);
    }
    setcookie(COOKIE, $token, ['expires' => time() + 60 * 60 * 24 * 30, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Lax']);
    header('Location: ' . $next, true, 303);
    exit;
}

if (!hash_equals($token, (string)($_COOKIE[COOKIE] ?? ''))) {
    comingSoon($root);
}

// Authorised: serve the requested static file
$path = rawurldecode((string)parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH));
$file = realpath($root . $path);
if ($file !== false && is_dir($file)) {
    $file = realpath($file . '/index.html');
}
if ($file === false || !str_starts_with($file, $root . DIRECTORY_SEPARATOR) || !is_file($file)
    || preg_match('#/\.|\.php$#i', substr($file, strlen($root)))) {
    http_response_code(404);
    $file = $root . '/404.html';
}

$types = [
    'html' => 'text/html; charset=utf-8', 'css' => 'text/css', 'js' => 'text/javascript', 'mjs' => 'text/javascript',
    'json' => 'application/json', 'xml' => 'application/xml', 'txt' => 'text/plain; charset=utf-8',
    'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp',
    'gif' => 'image/gif', 'ico' => 'image/x-icon', 'woff' => 'font/woff', 'woff2' => 'font/woff2',
    'mp4' => 'video/mp4', 'webm' => 'video/webm', 'pdf' => 'application/pdf', 'yml' => 'text/yaml', 'yaml' => 'text/yaml',
];
$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
header('Cache-Control: ' . ($ext === 'html' ? 'no-cache' : 'public, max-age=3600'));
header('Content-Length: ' . filesize($file));
readfile($file);
