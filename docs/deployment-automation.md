# Automatizarea Deployment-ului pe VPS

Acest document descrie două metode principale prin care putem automatiza procesul de deployment pentru aplicația Dental Chart pe serverul Contabo VPS.

## 1. Varianta A: GitHub Actions (Complet Automat)
Aceasta este metoda recomandată pentru mediile de producție. Deployment-ul se declanșează automat de fiecare dată când faci `push` pe branch-ul `main`.

### Cum funcționează:
1. Faci `push` pe branch-ul `main`.
2. GitHub pornește un "Runner" (un mic server temporar).
3. Runner-ul se conectează prin SSH la VPS-ul tău.
4. Execută comenzile de actualizare (git pull, npm install, pm2 restart).

### Configurare:
Creează un fișier `.github/workflows/deploy.yml` cu următorul conținut:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/pixtooth/repo
            git pull origin main
            
            # Backend
            cd server
            npm install --production
            pm2 restart pixtooth-api
            
            # Frontend (dacă este servit de Nginx de pe VPS)
            cd ..
            npm install
            npm run build
```

**Cerințe**: Trebuie să adaugi `VPS_HOST`, `VPS_USER` și `VPS_SSH_KEY` în **Settings > Secrets and variables > Actions** din repository-ul tău GitHub.

---

## 2. Varianta B: Script Local (Manual-Automatizat)
Dacă preferi să ai control total și să declanșezi deployment-ul manual de pe calculatorul tău printr-o singură comandă.

### Cum funcționează:
Rulezi o comandă (ex: `npm run deploy`) care execută un script local. Acest script se conectează la server și rulează pașii necesari.

### Configurare:
Adaugă un script în `package.json` de la rădăcina proiectului:

```json
"scripts": {
  "deploy": "ssh root@api.pixtooth.com 'cd /opt/pixtooth/repo && git pull origin main && cd server && npm install && pm2 restart pixtooth-api && cd .. && npm install && npm run build'"
}
```

**Utilizare**: 
```bash
npm run deploy
```

---

## Întrebări Frecvente

### Se va întâmpla automat la push pe main?
**Da**, dacă alegi **Varianta A (GitHub Actions)**. Este cea mai modernă metodă ("Continuous Deployment").

### Putem rula o comandă locală?
**Da**, dacă alegi **Varianta B (Script Local)**. Este utilă dacă vrei să testezi deployment-ul rapid fără să treci prin pipeline-ul GitHub.

### Ce recomandăm?
Recomandăm **GitHub Actions** deoarece:
- Garantează că pe server ajunge exact ce este pe branch-ul `main`.
- Oferă log-uri clare în interfața GitHub dacă ceva nu merge bine.
- Nu depinde de configurația SSH de pe calculatorul tău personal (o poate face oricine are acces la repo).

---

## Pași de Securitate Importanți
1. **Chei SSH**: Nu folosi parola de root în scripturi. Folosește chei SSH (`ssh-keygen`).
2. **Variabile de Mediu**: Fișierul `.env` de pe server **nu** trebuie suprascris de automatizare. Acesta rămâne manual pe server pentru securitate.
3. **Backup**: Înainte de automatizarea completă, asigură-te că ai un backup al bazei de date (DynamoDB în cazul nostru este gestionat de AWS, deci suntem ok).
