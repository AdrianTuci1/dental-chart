# Configurarea DynamoDB pentru Dental Chart

Backend-ul aplicatiei Dental Chart foloseste o structura de tip **Single-Table Design** în Amazon DynamoDB pentru a stoca rapid si scalabil datele.

## Pașii pentru configurarea tabelei în contul AWS:

1. Autentifică-te in consola AWS și accesează serviciul **DynamoDB**.
2. Apasă pe **Create table**.
3. Setează următoarele atribute:
   - **Table name**: `DentalChart` (sau cum ai denumit variabila de mediu `TABLE_NAME` din backend)
   - **Partition key (PK)**: Setează numele de atribut la `PK` și tipul `String`.
   - **Sort key (SK)**: Setează numele de atribut la `SK` și tipul `String`.
4. Capacitate (Read/Write capacity settings):
   - Poți alege `On-Demand` pentru a elimina managementul de provizionare dacă traficul variază sau `Provisioned` dacă vrei capacități minime/fixe gratuite (Free Tier: 25 WCU / 25 RCU).
5. Apasă **Create table** și așteaptă ca tabela să devină activă (stare: *Active*).

---

## Variabile de Mediu `.env`

Pentru ca serverul de Node.js să se poată conecta la tabela ta de DynamoDB, fișierul `.env` din folderul `/server` trebuie să conțină credențiale valide de la un utilizator IAM ce are drepturi complete de citire/scriere (`dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:Query`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem`) pe această tabelă.

Exemplu `.env`:
```env
PORT=3001
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
DYNAMODB_TABLE_NAME=DentalChart
```

## Structura Datelor (Single-Table Design)

Modulul `BaseRepository` și repo-urile derivate folosesc aceste structuri pentru chei:

| Entitate         | Format `PK` `(Partition Key)`  | Format `SK` `(Sort Key)`               |
|------------------|--------------------------------|-----------------------------------------|
| **Clinic**       | `CLINIC#<id>`                  | `METADATA#`                             |
| **Medic**        | `MEDIC#<id>`                   | `METADATA#`                             |
| **Patient Data** | `PATIENT#<id>`                 | `METADATA#`                             |
| **History**      | `PATIENT#<id>`                 | `HISTORY#<date>#<id>`                   |
| **TreatmentPlan**| `PATIENT#<id>`                 | `PLAN#<plan_id>`                        |

Prin folosirea structurii hibride cu `PATIENT#<id>`, un query unic poate prelua cu ușurință toate detaliile metadata ale pacientului DAR și planurile de tratament și istoricul asociate.
