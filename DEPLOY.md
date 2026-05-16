# Deploy Guide — Caregiver Dashboard pe Microsoft Azure

> ⏱️ **Urgență:** creditele Azure expiră pe **25 mai 2026**. Deploy-ul durează ~1h. După demo, închidem resursele.

## Stack

```
Browser
  ↓ https
Azure Static Web Apps (Frontend, free)  →  Azure Container Apps (Backend, Docker)  →  MongoDB Atlas
                                              ↑ pulls image from
                                            Azure Container Registry (ACR Basic, ~€5/lună)
```

| Componentă | Serviciu Azure | Cost din credite |
|---|---|---|
| Backend FastAPI + modele `.joblib` | Azure Container Apps | ~€0 (free tier consumption) |
| Image registry | Azure Container Registry (Basic) | ~€0.15/zi ≈ €1.5 pe 9 zile |
| Frontend React static | Azure Static Web Apps (Free tier) | €0 |
| Database | MongoDB Atlas (Raul) | €0 |
| **TOTAL pe 9 zile** | | **~€1.5–3 din €170 credit** |

---

## 0. Prereq local

```bash
# Din directorul proiectului
python3 --version    # Recomandat: 3.12 (ai 3.13 — vezi nota de jos)
node --version       # >= 20 (ai 22 ✅)
git status           # Vezi modificările (curat sau e ok)
```

**Notă Python 3.13:** Bibliotecile ML (numpy/scikit-learn/shap) pot face probleme pe 3.13. Dacă pipeline-ul eșuează la pasul 4, instalează Python 3.12:
```bash
brew install python@3.12
python3.12 -m venv venv
```

---

## 1. Instalează Azure CLI (~3 min)

```bash
brew install azure-cli
az --version
```

---

## 2. Login + setare context (~2 min)

```bash
# Login interactiv (deschide browser)
az login

# Vezi subscription-ul (deja ai unul — "Azure subscription 1")
az account show

# Setează variabile pentru tot ghidul
export RG="caregiver-rg"
export LOCATION="westeurope"          # Amsterdam — cel mai apropiat de RO
export ACR="caregiver$(date +%s)"      # nume unic global pentru ACR
export BACKEND_APP="caregiver-backend"
export FRONTEND_APP="caregiver-frontend"

# Creează un resource group (containerul logic pentru toate resursele)
az group create --name $RG --location $LOCATION
```

Activează provider-ii necesari (rulează 1 dată):

```bash
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.ContainerRegistry
```

---

## 3. MongoDB Atlas — ce iei de la Raul (~5 min)

Cere-i lui Raul:

> *„Frate, dă-mi `MONGO_URI` din `backend/.env`. Și pune `0.0.0.0/0` în Atlas → Network Access dacă nu e deja."*

URI-ul arată: `mongodb+srv://user:pass@cluster.xxx.mongodb.net/?retryWrites=true&w=majority`

```bash
export MONGO_URI="mongodb+srv://user:pass@cluster.xxx.mongodb.net/?retryWrites=true&w=majority"
export MONGO_DB_NAME="pcd-module3-project"
export JWT_SECRET=$(openssl rand -hex 32)
```

> **NU trebuie cluster nou** — Raul are deja unul.

---

## 4. Rulează ML pipeline local — o singură dată (~10 min)

Generează `.joblib` modele + populează MongoDB.

```bash
# Setup virtualenv (cu Python 3.12 dacă merge, altfel 3.13)
python3 -m venv venv
./venv/bin/pip install -r ml-pipeline/requirements.txt
./venv/bin/pip install -r backend/requirements.txt
./venv/bin/pip install python-multipart

# Descarcă datasetul
chmod +x data/download.sh
./data/download.sh

# Config Atlas pentru pipeline
cp .env.example ml-pipeline/.env
# Editează ml-pipeline/.env cu MONGO_URI + MONGO_DB_NAME

cd ml-pipeline
../venv/bin/python -m src.pipeline
cd ..

# Verifică modelele
ls ml-pipeline/outputs/*.joblib
# model_BATHROOM.joblib  model_BEDROOM.joblib  model_KITCHEN.joblib  model_LIVING_ROOM.joblib
```

---

## 5. Deploy backend pe Azure Container Apps (~10 min)

Comanda de mai jos face TOT (build în cloud, push în ACR, deploy în Container Apps). Rulează din rădăcina proiectului:

```bash
az containerapp up \
  --resource-group $RG \
  --name $BACKEND_APP \
  --location $LOCATION \
  --source . \
  --dockerfile backend/Dockerfile \
  --target-port 8080 \
  --ingress external \
  --env-vars \
      MONGO_URI="$MONGO_URI" \
      MONGO_DB_NAME="$MONGO_DB_NAME" \
      JWT_SECRET="$JWT_SECRET"
```

Așteaptă 5-10 min (vezi progresul în terminal). La final primești URL-ul.

```bash
# Capturează URL-ul
export BACKEND_URL=$(az containerapp show --name $BACKEND_APP --resource-group $RG --query properties.configuration.ingress.fqdn -o tsv)
export BACKEND_URL="https://$BACKEND_URL"
echo "Backend URL: $BACKEND_URL"
```

**Test rapid:**

```bash
curl $BACKEND_URL/
# {"status":"ok","service":"caregiver-dashboard-api"}

curl $BACKEND_URL/days | head -c 200
# JSON cu zile
```

Dacă vrei să crești RAM-ul (default ~0.5GB, dacă e prea puțin pentru shap):
```bash
az containerapp update --name $BACKEND_APP --resource-group $RG \
  --cpu 1 --memory 2Gi
```

---

## 6. Deploy frontend pe Azure Static Web Apps (~10 min)

Static Web Apps se conectează la GitHub și auto-deploy la fiecare push. Pasul cel mai simplu îl faci prin **portal**, nu CLI (CLI cere token GitHub).

### 6a. Commit & push schimbările

Înainte de Static Web Apps, push tot ce am adăugat eu + modelele:

```bash
git add .
git status                  # verifică ce intră
git commit -m "Add Azure deployment config (Dockerfiles, render.yaml, DEPLOY.md)"
git push origin main
```

> ⚠️ Dacă `git push` zice că `.joblib` files sunt prea mari (>50MB), spune-mi și folosim alt approach. De obicei sunt sub 1MB fiecare.

### 6b. Creează Static Web App din portal

1. Mergi la **[portal.azure.com](https://portal.azure.com)** → search „Static Web Apps" → **Create**
2. Completează:
   - **Resource Group**: `caregiver-rg`
   - **Name**: `caregiver-frontend`
   - **Plan type**: **Free**
   - **Region**: West Europe
   - **Source**: GitHub → autorizează → selectează repo-ul `PotatoOverlord22/PCD-Module3-Project` → branch `main`
   - **Build Details**:
     - Build Presets: **Custom**
     - App location: `/frontend`
     - Api location: (gol)
     - Output location: `dist`
3. Click **Review + create** → **Create**

Azure creează automat un workflow GitHub Actions (`.github/workflows/azure-static-web-apps-*.yml`) și începe build-ul.

### 6c. Setează env var pentru API URL

În portal, navighează la noul Static Web App → **Environment variables** (în sidebar) → **Add**:
- Name: `VITE_API_BASE_URL`
- Value: `$BACKEND_URL` (URL-ul backend-ului de la pasul 5, ex. `https://caregiver-backend.purplebush-xxx.westeurope.azurecontainerapps.io`)

Apoi forțează un re-build: în GitHub → **Actions** → ultimul workflow → **Re-run all jobs**.

### 6d. Ia URL-ul frontend

În portal, în Overview → **URL** copy. Sau:

```bash
az staticwebapp show --name $FRONTEND_APP --resource-group $RG --query defaultHostname -o tsv
```

---

## 7. Verificare în browser (~5 min)

Deschide URL-ul frontend (`https://<...>.azurestaticapps.net`). Testează:

- [ ] Login cu **caregiver / care123** → tabs **Anomalies, All Days, Simulate** vizibile
- [ ] Logout → login cu **admin / admin123** → vezi în plus **Evaluation, Audit Log**
- [ ] **Anomalies** încarcă carduri
- [ ] Click pe o zi → explicații SHAP
- [ ] **Simulate** — încarcă `data/sample_day.csv` → primești rezultat
- [ ] **Evaluation** (admin) → tabel P/R/F1
- [ ] **Audit Log** (admin) → vezi loguri

---

## 8. Update după modificări

**Backend** (push automat la fiecare schimbare):

```bash
az containerapp up \
  --resource-group $RG \
  --name $BACKEND_APP \
  --source . \
  --dockerfile backend/Dockerfile
```

**Frontend**: `git push origin main` → GitHub Actions deploy-uiește automat în 2-3 min.

---

## 9. Cleanup după demo (când ai terminat)

Ca să nu mai consume credite:

```bash
az group delete --name $RG --yes --no-wait
```

Șterge tot resource group-ul (ACR, Container App, Static Web App, environment). Atlas rămâne intact.

---

## Troubleshooting

**`az: command not found`** → `brew install azure-cli` apoi închide+redeschide terminalul.

**`az containerapp up` cere extension** → confirmă cu Y la prompt.

**Build eșuează „MongoDB connection refused"** → IP Azure Build nu e whitelisted. Pune `0.0.0.0/0` în Atlas → Network Access.

**Backend pornește dar `/days` returnează 500** → MongoDB nu e populat. Re-rulează `python -m src.pipeline` local cu `MONGO_URI` setat.

**Frontend afișează pagină albă / cere localhost:8000** → `VITE_API_BASE_URL` nu a ajuns în build. Verifică în portal Static Web App → Environment variables. Re-run workflow.

**„Out of memory" în Container App** → crește la 2GB:
```bash
az containerapp update --name $BACKEND_APP --resource-group $RG --cpu 1 --memory 2Gi
```

**Container App e „sleeping" / cold start lent** → scale-to-zero e activ. Pentru demo, scoate-l:
```bash
az containerapp update --name $BACKEND_APP --resource-group $RG --min-replicas 1
```
(Consumă mai mult credit dar nu așteaptă la primul request.)

**Permission denied / `az login` greșit subscription** → `az account list -o table` apoi `az account set --subscription "Azure subscription 1"`.

---

## Cost monitor (verifică din când în când)

```bash
# Vezi cât ai consumat azi
az consumption usage list --top 10 -o table

# Vezi resursele care consumă
az resource list --resource-group $RG -o table
```

Sau în portal: **Cost Management + Billing** → **Cost analysis**.

---

## Bonus: ce-i spui prof-ului / colegilor

> *„Aplicația e live la `<URL-frontend>`. Backend la `<URL-backend>`. Credentials în README. MongoDB rămâne Atlas-ul lui Raul. Stack: Azure Container Apps + Azure Static Web Apps. Toate componentele scalează automat și consum minim de credite."*

Pentru paper / prezentare, poți cita:
- **Frontend**: Azure Static Web Apps (free tier, global CDN)
- **Backend**: Azure Container Apps (consumption plan, scale-to-zero)
- **Image registry**: Azure Container Registry (Basic SKU)
- **Database**: MongoDB Atlas M0 (free tier)
- **CI/CD**: GitHub Actions (auto-generated by Static Web Apps)
