# Pregătirea VPS-ului pentru GitHub Actions

Pentru ca GitHub Actions să poată trimite codul automat pe serverul tău, trebuie să urmezi acești pași de configurare pe VPS.

## 1. Generarea Cheii SSH (pe calculatorul tău sau pe VPS)
GitHub are nevoie de o cheie privată pentru a se "loga" prin SSH pe VPS-ul tău.

1. **Dacă nu ai deja o cheie SSH**, generează una pe VPS (sau local):
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"
   ```
   *Apasă Enter la toate întrebările (nu pune parolă la cheie).*

2. **Adaugă cheia publică în `authorized_keys`**:
   ```bash
   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   ```

3. **Copiați cheia privată**:
   Rulează comanda următoare și copiază tot textul (începând cu `-----BEGIN RSA PRIVATE KEY-----`):
   ```bash
   cat ~/.ssh/id_rsa
   ```

---

## 2. Configurarea Secretelor în GitHub
Mergi pe GitHub în repository-ul tău la **Settings > Secrets and variables > Actions** și adaugă următoarele secrete:

- `VPS_HOST`: Adresa IP a serverului tău (ex: `123.123.123.123` sau `api.pixtooth.com`).
- `VPS_USER`: Utilizatorul cu care te conectezi (probabil `root` sau utilizatorul creat de tine).
- `VPS_SSH_KEY`: Conținutul cheii private pe care l-ai copiat la pasul anterior.

---

## 3. Autorizarea VPS-ului să descarce codul de pe GitHub
Deoarece GitHub Actions rulează comanda `git pull` pe serverul tău, serverul tău (VPS) trebuie să aibă dreptul să citească repository-ul.

1. **Generează o cheie de tip Deploy Key pe VPS**:
   ```bash
   ssh-keygen -t ed25519 -C "vps-deploy-key"
   ```
2. **Copiați cheia publică**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
3. **Adaugă cheia în GitHub**:
   Mergi la **Settings > Deploy keys > Add deploy key**.
   - Title: `VPS-Server`
   - Key: Lipiți cheia copiată.
   - **Nu** bifați "Allow write access" (avem nevoie doar de read).

---

## 4. Pregătirea Folderului Proiectului
Asigură-te că folderul în care va sta codul este creat și are permisiunile corecte:

```bash
sudo mkdir -p /opt/pixtooth/repo
sudo chown -R $USER:$USER /opt/pixtooth
cd /opt/pixtooth/repo
git clone git@github.com:AdrianTuci1/dental-chart.git .
```

---

## 5. Instalarea utilitarelor necesare pe VPS
Asigură-te că următoarele sunt instalate pe VPS:
- **Node.js & NPM** (versiunea 18+ recomandată)
- **PM2**: `sudo npm install -g pm2`
- **Git**: `sudo apt install git`

---

## 6. Testarea manuală
Înainte de a lăsa GitHub să facă totul automat, rulează o dată manual pașii pe server pentru a te asigura că totul e ok:
```bash
cd /opt/pixtooth/repo
git pull origin main
cd server
npm install
pm2 start app.js --name pixtooth-api
```

După ce acești pași sunt gata, orice `push` pe branch-ul `main` va declanșa automat update-ul pe server!
