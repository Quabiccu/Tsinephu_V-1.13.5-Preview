# Tsinephu

**Tsinephu** is a multilingual social media platform where thoughts are shared as **Parniks** and reshared as **ReParniks**. Designed for global community building with support for 100+ languages, interactive map-based posts, direct messaging, and real-time notifications.

---

## Features

- **Parniks & ReParniks** — Share thoughts and reshare others' content
- **100+ Language Support** — Including living, ancient, and symbolic languages
- **Interactive Map Posts** — Draw zones, markers, lines, and circles on real-world maps
- **Direct Messaging** — Private conversations with image sharing
- **Push Notifications** — Web Push API for alerts on all platforms, including Android PWA
- **Dark/Light Mode** — Full theme support
- **Translation** — Auto-translate Parniks between languages
- **Admin Tools** — Ban functionality with comet-star badge
- **Polls** — Create interactive polls on Parniks
- **Offline Support** — Service worker for cache and background sync
- **PWA Installable** — Add to home screen on any device

---

## APK Conversion (Android)

Tsinephu is configured for easy conversion to Android APK using **Capacitor**.

### Prerequisites

```bash
npm install -g @capacitor/cli
# or
yarn global add @capacitor/cli
```

### Steps to Build APK

```bash
# 1. Build the web app
npm run build

# 2. Add Android platform (first time only)
npx cap add android

# 3. Sync web assets to Android project
npx cap sync android

# 4. Open Android Studio
npx cap open android

# 5. In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
# Or for Play Store: Build > Build Bundle(s) / APK(s) > Build Bundle(s)
```

### Alternative: Command-line build

```bash
# After sync, build debug APK
npx cap build android --debug

# Or release APK (requires keystore setup)
npx cap build android --release
```

### Keystore Setup (for Play Store release)

Edit `capacitor.config.json` and add your keystore details under `android.buildOptions`:

```json
{
  "android": {
    "buildOptions": {
      "keystorePath": "path/to/keystore.jks",
      "keystoreAlias": "tsinephu",
      "keystorePassword": "your-password",
      "keystoreKeyPassword": "your-key-password",
      "releaseType": "AAB"
    }
  }
}
```

---

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Maps**: Leaflet.js (OpenStreetMap)
- **State**: React Context API + LocalStorage persistence
- **PWA**: Service Worker + Web Push API + Manifest
- **Mobile**: Capacitor (Android/iOS wrapper)

---

## Supported Languages

### Living Languages
English, Spanish, Catalan, Afrikaans, German, Dutch, Italian, Turkish, Russian, Ukrainian, Polish, Portuguese, Georgian, Azerbaijani, Armenian, Chinese, Persian, Japanese, French, Indonesian, Vietnamese, Malay, Greek, Frisian, Romanian, Arabic, Kurdish, Hebrew, Yiddish, Ladino, Serbian, Kazakh, Crimean Tatar, Occitan, Welsh, Basque, Quechua, Esperanto, Rusyn, Hindi, Latin, Romansh, Swiss German, Belarusian, Abkhaz, Ossetian, Galician, Uzbek, Croatian, Valencian, Macedonian, Bulgarian, Hungarian, Finnish, Norwegian, Icelandic, Swedish, Danish, Faroese, Nahuatl, Toki Pona, Asturian, Aragonese, Irish, Scottish Gaelic, Cornish, Chuvash, Tatar, Karelian, Sicilian, Corsican, Standard Moroccan Tamazight, Tigrinya, Swahili, Zulu, Amharic, Slovenian, Slovak, Lithuanian, Latvian, Estonian, Javanese, Sundanese, Tamil, Kannada, Urdu, Pashto, Nuosu, Nigerian Pidgin, Haitian Creole, Papiamentu, Czech, Cantonese, Korean

### Ancient & Symbolic Languages
Ainu, Inuktitut, Chechen, Tat, Talysh, Avar, Luri, Baluchi, Interlingua, Hittite, Urartian, Tartessian, Sumerian, Phrygian, Iberian, Elamite, Phoenician, Lydian, Lycian, Egyptian, Sanskrit

---

## License

```
Copyright 2026 Quabiccu

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

**Attribution**: Quabiccu | 2026

---

## Terms of Service

Quabiccu does not assume responsibility for the user's possible illegal actions in Tsinephu. All responsibility for the publications belongs to the user and to the user alone. The user agrees to post responsibly in accordance with their current legislation and assumes any and all responsibility in case of violation of the legal order on their part. By using Tsinephu, you acknowledge that you are solely responsible for all content you post, share, or distribute through the platform.
