# MYRAGE

**Ephemeral, client-side encrypted links & messages.** Generate self-destructing secrets secured by AES-256-GCM, protected by a password, and never stored in readable form on any server. Pure privacy.

## Key Features
- Client-side only encryption (AES-256-GCM via Web Crypto API)
- Zero-knowledge architecture (no plaintext ever sent)
- Self-destruction modes:
  - `1view`: destroy after first successful access
  - `10min`: auto-expire after creation time window
- Multi-item secret payload (multiple URLs or text lines)
- Password generator (cryptographically secure random 128-bit then Base64 encoded)
- Dark/Light theme toggle (persisted in localStorage)
- Accessible link copying & content reveal UX
- Mobile-friendly responsive layout

## Security Model
| Aspect | Implementation |
| ------ | -------------- |
| Encryption | AES-256-GCM (Web Crypto API) |
| Key Derivation | PBKDF2 with 100,000 iterations / SHA-256 |
| Salt & IV | Random per secret (16B salt, 12B IV) |
| Payload Integrity | GCM authentication tag included |
| Zero-Knowledge | Server never receives password or plaintext |
| Destruction | Hash cleared (`history.replaceState`) for 1-view mode |
| Expiration | Timestamp + mode checked on decrypt |

### Threat Considerations
- Replay: Once destroyed or expired, the hash no longer decrypts successfully.
- Interception: Without password, ciphertext is infeasible to recover.
- Persistence: Browser history can keep ciphertext; user can clear manually.
- Shoulder surfing: Encourage immediate closure after reading.

## Folder Structure
```
MYRAGE/
  index.html          # Main application HTML
  css/
    myrage.css        # Extracted styles (Space Mono theme, layout, animations)
  js/
    myrage.js         # All client logic (encryption, UI, generation, decrypt)
  img/
    og-image.svg      # Social preview (Open Graph / Twitter)
  favicon.svg         # SVG favicon
  robots.txt          # Allow crawling & points to sitemap
  sitemap.xml         # SEO sitemap
  humans.txt          # Project & author meta info
  README.md           # This documentation
```

## How It Works (Flow)
1. User enters secret lines + password (or generates one).
2. Data object `{ title, content, expiration, timestamp }` JSON-stringified.
3. Salt & IV generated; password → derived key via PBKDF2.
4. JSON encrypted under AES-GCM; salt+IV+ciphertext concatenated & Base64 encoded.
5. Link built as `https://yourdomain/path#<BASE64>` and displayed.
6. Recipient opens link, provides password:
   - Salt/IV parsed
   - Key re-derived
   - Ciphertext decrypted & validated
   - Expiration check enforced
   - Content rendered; if `1view`, hash removed from URL

## Usage
Open `index.html` in any modern browser (supports Web Crypto API). No build step required.

### Creating a Secret
1. Enter optional title.
2. Add one or more URL/text lines.
3. Provide or generate password.
4. Choose expiration mode.
5. Click "Créer le lien sécurisé".
6. Copy and share the generated link.

### Viewing a Secret
1. Open the shared URL.
2. Enter the password.
3. If valid & not expired, content decrypts and displays.
4. In `1view` mode, the fragment is cleared and cannot be reused.

## SEO & Metadata
Included assets for optimal indexing & sharing:
- Canonical link dynamic assignment
- Open Graph (`og:title`, `og:description`, `og:image`, `og:locale`)
- Twitter Card metadata
- `robots.txt` + `sitemap.xml` for discoverability
- `humans.txt` for transparency
- JSON-LD `WebApplication` schema embedded

## Customization
- Modify colors & spacing in `css/myrage.css`.
- Add new expiration policies by extending the `generateLink` / `decryptAndShow` logic.
- Replace the font by editing the Google Fonts link in `index.html`.
- For multi-language support, duplicate textual strings and implement a language toggle.

## Extensibility Ideas
- Add sharing analytics (still client-side, opt-in, privacy preserving).
- Integrate Web Share API for mobile.
- Export decrypted content as downloadable secure archive.
- Add password strength meter.
- Optional time bomb mode (e.g. N seconds after first view).
- PWA manifest & Service Worker for offline creation / viewing.

## Accessibility Notes
- Large interactive targets for buttons (>=40px height).
- Theme contrast: dark mode default for reduced eye strain.
- Focus states rely on native browser outlines (recommended).

## Browser Support
Requires modern browsers supporting:
- Web Crypto Subtle API (AES-GCM, PBKDF2)
- ES6 modules & standard DOM APIs

Tested on latest Chrome, Firefox, Edge.

## License
You can adapt and reuse this project subject to the original author's site terms. Consider adding a LICENSE file (MIT recommended) if publishing publicly.

## Author
Maintained by **zigmoon.com**. For questions: `contact@zigmoon.com`.

---
For production deployment, host `index.html` at a stable HTTPS origin and ensure fragment (`#ciphertext`) is not logged by analytics.
