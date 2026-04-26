# Automatizarea Deployment-ului pe VPS

Acest document descrie metoda recomandată pentru deployment-ul backend-ului Dental Chart pe serverul VPS.

## Metoda: Script Local (Manual-Automatizat)
Aceasta este cea mai robustă metodă, oferindu-ți control total și feedback în timp real de pe calculatorul tău.

### Cum funcționează:
Folosim `rsync` pentru a transfera doar fișierele modificate din folderul `server` către VPS și apoi repornim procesul prin SSH.

### Configurare în `package.json`:
Comanda este deja configurată în rădăcina proiectului:

```json
"scripts": {
  "deploy": "npm run deploy:backend",
  "deploy:backend": "rsync -avz --exclude 'node_modules' server/ root@api.pixtooth.com:/opt/pixtooth-backend/ && ssh root@api.pixtooth.com 'cd /opt/pixtooth-backend && npm install --production && pm2 restart pixtooth-backend'"
}
```

### Utilizare:
Din rădăcina proiectului (pe calculatorul tău), rulează:

```bash
npm run deploy
```

### Avantaje:
1.  **Viteză**: `rsync` transferă doar diferențele (delta), nu tot folderul de fiecare dată.
2.  **Siguranță**: Folderul `node_modules` este exclus automat; dependințele sunt instalate direct pe server pentru a asigura compatibilitatea cu Linux.
3.  **Control**: Dacă există o eroare la conexiune sau la instalare, o vezi imediat în terminalul tău.

---

## Pregătirea VPS-ului (O singură dată)
Pentru ca acest script să meargă fără să îți ceară parola de fiecare dată, asigură-te că ai cheia ta SSH pe server:

1.  **Trimite cheia SSH pe server**:
    ```bash
    ssh-copy-id root@api.pixtooth.com
    ```
2.  **Asigură-te că folderul destinație există**:
    ```bash
    ssh root@api.pixtooth.com 'mkdir -p /opt/pixtooth-backend'
    ```

Gata! Acum ești la o singură comandă distanță de a avea codul live pe server.
