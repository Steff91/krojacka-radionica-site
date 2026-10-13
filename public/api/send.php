<?php
/**
 * Form handler for the contact and booking forms (static site on Plesk, PHP on the server).
 *
 * 1. Checks a honeypot field and the Google reCAPTCHA v3 token (secret key stays on the server).
 * 2. Sends the enquiry by email (PHP mail(), i.e. the server's mail system).
 * 3. Answers JSON to the site's JavaScript, or redirects back when JavaScript is off.
 *
 * Configuration lives OUTSIDE the web root, never in Git:
 *   <domain root>/krojacka-config.php   (one level above httpdocs) — see server/config.example.php
 */

declare(strict_types=1);

$configFile = dirname(__DIR__, 2) . '/krojacka-config.php';
$config = is_file($configFile) ? require $configFile : [];
$config += [
    'to' => '',                    // where enquiries go
    'from' => '',                  // sender address on the site's domain, e.g. noreply@krojackaradionicabg.rs
    'recaptcha_secret' => '',
    'recaptcha_min_score' => 0.5,
    'allowed_hosts' => [],         // e.g. ['krojackaradionicabg.rs', 'www.krojackaradionicabg.rs']
];

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function respond(bool $ok, string $code, bool $json): void
{
    if ($json) {
        http_response_code($ok ? 200 : ($code === 'method' ? 405 : 400));
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'code' => $code]);
        exit;
    }
    // No JavaScript: go back to the page the form was on, with a status flag
    $back = $_SERVER['HTTP_REFERER'] ?? '/';
    $back = preg_replace('/[?#].*$/', '', $back);
    header('Location: ' . $back . '?poslato=' . ($ok ? '1' : '0') . '#kontakt', true, 303);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'method', $wantsJson);
}

if (!$config['to'] || !$config['from']) {
    error_log('[send.php] missing configuration (to/from) in ' . $configFile);
    respond(false, 'config', $wantsJson);
}

// Only accept posts coming from our own pages
if ($config['allowed_hosts']) {
    $origin = parse_url($_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST);
    if (!$origin || !in_array($origin, $config['allowed_hosts'], true)) {
        respond(false, 'origin', $wantsJson);
    }
}

// Honeypot: real visitors never see or fill this field
if (trim((string)($_POST['website'] ?? '')) !== '') {
    respond(true, 'ok', $wantsJson); // pretend success, send nothing
}

// reCAPTCHA v3
if ($config['recaptcha_secret']) {
    $token = (string)($_POST['g-recaptcha-response'] ?? '');
    if ($token === '') {
        respond(false, 'captcha', $wantsJson);
    }
    $ctx = stream_context_create(['http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/x-www-form-urlencoded',
        'content' => http_build_query([
            'secret' => $config['recaptcha_secret'],
            'response' => $token,
            'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
        ]),
        'timeout' => 8,
    ]]);
    $raw = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $ctx);
    $check = $raw ? json_decode($raw, true) : null;
    if (!$check || empty($check['success']) || ($check['score'] ?? 0) < (float)$config['recaptcha_min_score']) {
        error_log('[send.php] reCAPTCHA rejected: ' . ($raw ?: 'no response'));
        respond(false, 'captcha', $wantsJson);
    }
}

// Collect fields (names are the same on both language versions)
$clean = static fn($v, int $max = 2000): string => mb_substr(trim(str_replace(["\r", "\0"], '', (string)$v)), 0, $max);
$labels = [
    '_tema' => 'Tema',
    'usluga' => 'Usluga',
    'ime' => 'Ime',
    'kontakt' => 'Telefon ili email',
    'telefon' => 'Telefon',
    'email' => 'Email',
    'datum' => 'Željeni datum',
    'deo_dana' => 'Deo dana',
    'rok' => 'Rok',
    'kontakt_preko' => 'Kontakt preko',
    'poruka' => 'Poruka',
    'inspiracija' => 'Inspiracija',
    'jezik' => 'Jezik sajta',
];
$data = [];
foreach ($labels as $key => $label) {
    $value = $clean($_POST[$key] ?? '', $key === 'poruka' ? 5000 : 300);
    if ($value !== '') {
        $data[$label] = $value;
    }
}

$name = $data['Ime'] ?? '';
$reach = $data['Telefon ili email'] ?? $data['Telefon'] ?? $data['Email'] ?? '';
if ($name === '' || $reach === '') {
    respond(false, 'fields', $wantsJson);
}

// Reply-To: the visitor's email, if they gave one
$replyTo = '';
foreach ([$data['Email'] ?? '', $data['Telefon ili email'] ?? ''] as $candidate) {
    if (filter_var($candidate, FILTER_VALIDATE_EMAIL)) {
        $replyTo = $candidate;
        break;
    }
}

$topic = $data['Tema'] ?? 'Upit sa sajta';
$subject = '=?UTF-8?B?' . base64_encode($topic . ': ' . $name . (isset($data['Usluga']) ? ' — ' . $data['Usluga'] : '')) . '?=';

$body = '';
foreach ($data as $label => $value) {
    $body .= $label . ":\n" . $value . "\n\n";
}
$body .= "—\nPoslato sa sajta, " . date('d.m.Y. H:i') . "\n";

$headers = [
    'From: =?UTF-8?B?' . base64_encode('Krojačka radionica — sajt') . '?= <' . $config['from'] . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'MIME-Version: 1.0',
];
if ($replyTo) {
    $headers[] = 'Reply-To: ' . $replyTo;
}

$sent = mail($config['to'], $subject, $body, implode("\r\n", $headers), '-f' . $config['from']);
if (!$sent) {
    error_log('[send.php] mail() failed');
}
respond($sent, $sent ? 'ok' : 'mail', $wantsJson);
