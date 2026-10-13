<?php
/**
 * Copy to the server as  <domain root>/krojacka-config.php
 * (in Plesk: the folder ABOVE httpdocs, so it is never reachable from the web)
 * and fill in the values. Never commit the real file to Git.
 */
return [
    // Where enquiries from the contact and booking forms are delivered
    'to' => 'sladjanaguslov@gmail.com',

    // Sender address on the site's own domain (needed for delivery; set SPF/DKIM for the domain in Plesk/Cloudflare)
    'from' => 'noreply@krojackaradionicabg.rs',

    // Google reCAPTCHA v3 — SECRET key (the public site key lives in src/data/info.json)
    'recaptcha_secret' => '',

    // 0.0 (bot) – 1.0 (human); 0.5 is Google's suggested starting point
    'recaptcha_min_score' => 0.5,

    // Accept posts only from these hosts (leave empty to skip the check)
    'allowed_hosts' => ['krojackaradionicabg.rs', 'www.krojackaradionicabg.rs'],
];
