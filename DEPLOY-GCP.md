# Deploy Guide — Caregiver Dashboard pe Google Cloud Run

Ghid pas cu pas pentru deploy backend + frontend pe Google Cloud Run. MongoDB Atlas rămâne unde e (deja configurat de Raul). ML pipeline rulează doar local (o singură dată, ca să genereze modelele `.joblib` și să populeze Atlas).

## Stack-ul deploy-ului

```
Browser
  ↓ https
Frontend (Cloud Run, nginx)  →  Backend (Cloud Run, FastAPI + .joblib)  →  MongoDB Atlas
```

---

## 0. Ce trebuie să ai pe local înainte să începi

```bash
# Verifică versiunile (din directorul proiectului)
python3 --version    # >= 3.12
node --version       # >= 20
git status           # fără modificări neașteptate
```

Dacă lipsește Node 20: `brew install node@20 && brew link node@20 --force`.

---

## 1. Cont Google Cloud + credite gratuite (~10 min)

1. Mergi la **[console.cloud.google.com](https://console.cloud.google.com)** și loghează-te cu un cont Google.
2. Acceptă termenii, completează țara (Romania), apoi click **Try for free** / **Activate** → introdu un card (nu se taxează nimic în trial; doar verificare). Primești **$300 credit gratuit, valabil 90 zile**.
3. Creează un proiect nou:
   - Click sus pe selectorul de proiect → **NEW PROJECT**
   - Name: `pcd-caregiver-dashboard` (sau orice vrei)
   - Notează **Project ID** (ex. `pcd-caregiver-dashboard-123456`) — îl folosim mai jos.

---

## 2. Instalează gcloud CLI pe Mac (~5 min)

```bash
# Cu Homebrew (cel mai simplu)
brew install --cask google-cloud-sdk

# Verifică
gcloud --version
```

Dacă nu ai Homebrew: instalează-l de pe [brew.sh](https://brew.sh), sau urmează [cloud.google.com/sdk/docs/install-sdk](https://cloud.google.com/sdk/docs/install-sdk).

---

## 3. Autentificare + setare proiect (~3 min)

```bash
# Login interactiv (deschide browser)
gcloud auth login

# Setează proiectul tău (ÎNLOCUIEȘTE cu Project ID-ul tău)
export PROJECT_ID="pcd-caregiver-dashboard-123456"
gcloud config set project $PROJECT_ID

# Setează regiunea default (Belgia — cea mai apropiată de RO)
export REGION="europe-west1"
gcloud config set run/region $REGION
gcloud config set artifacts/location $REGION
```

Activează API-urile necesare (durează ~1 min, o singură dată per proiect):

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com
```

Creează repository-ul Artifact Registry (unde stau imaginile Docker):

```bash
gcloud artifacts repositories create caregiver \
  --repository-format=docker \
  --location=$REGION \
  --description="Caregiver dashboard images"
```

---

## 4. MongoDB Atlas — ce iei de la Raul (~5 min)

Cere-i lui Raul:

> *„Frate, dă-mi `MONGO_URI` din `backend/.env`. Și adaugă `0.0.0.0/0` în Atlas → Network Access dacă nu e deja, ca să se conecteze Cloud Run."*

URI-ul arată așa: `mongodb+srv://user:pass@cluster.xxx.mongodb.net/?retryWrites=true&w=majority`

Salvează-l într-o variabilă de mediu (NU îl pune în git):

```bash
export MONGO_URI="mongodb+srv://user:pass@cluster.xxx.mongodb.net/?retryWrites=true&w=majority"
export MONGO_DB_NAME="pcd-module3-project"
```

> **NU trebuie să creezi cluster nou** — Raul are deja unul. Dacă din vreun motiv nu mai funcționează, creezi unul gratis pe [cloud.mongodb.com](https://cloud.mongodb.com) (M0 free, 5 min, instrucțiuni în README principal).

---

## 5. Rulează ML pipeline local — o singură dată (~10 min)

Generează `.joblib` modele + populează MongoDB.

```bash
# Din rădăcina proiectului
python3 -m venv venv
./venv/bin/pip install -r ml-pipeline/requirements.txt
./venv/bin/pip install -r backend/requirements.txt
./venv/bin/pip install python-multipart

# Descarcă dataset-ul (1.6M evenimente, ~50 MB)
chmod +x data/download.sh
./data/download.sh

# Configurează env pentru pipeline ca să scrie și în Atlas
mkdir -p ml-pipeline
cp .env.example ml-pipeline/.env
# Editează ml-pipeline/.env și pune MONGO_URI + MONGO_DB_NAME

# Rulează pipeline-ul
cd ml-pipeline
../venv/bin/python -m src.pipeline
cd ..
```

**Verifică că s-au generat:**

```bash
ls ml-pipeline/outputs/*.joblib
# Trebuie să vezi: model_BATHROOM.joblib model_BEDROOM.joblib model_KITCHEN.joblib model_LIVING_ROOM.joblib
```

Dacă nu apar, nu putem face deploy backend — modelele se bagă în Docker image.

---

## 6. Deploy backend pe Cloud Run (~5 min)

Build & push imaginea (rulează din rădăcina proiectului):

```bash
gcloud builds submit . \
  --config=cloudbuild-backend.yaml \
  --substitutions=_REGION=$REGION,_PROJECT_ID=$PROJECT_ID
```

Așteaptă ~3-5 min (vezi progres în terminal). Apoi deploy în Cloud Run:

```bash
# Generează un JWT secret puternic (sau pune-l tu)
export JWT_SECRET=$(openssl rand -hex 32)

gcloud run deploy caregiver-backend \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/caregiver/caregiver-backend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --set-env-vars="MONGO_URI=$MONGO_URI,MONGO_DB_NAME=$MONGO_DB_NAME,JWT_SECRET=$JWT_SECRET"
```

La final, gcloud îți afișează URL-ul. Salvează-l:

```bash
export BACKEND_URL=$(gcloud run services describe caregiver-backend --region=$REGION --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

**Test rapid:**

```bash
curl $BACKEND_URL/
# {"status":"ok","service":"caregiver-dashboard-api"}

curl $BACKEND_URL/days | head -c 200
# JSON cu date
```

---

## 7. Deploy frontend pe Cloud Run (~3 min)

Build cu URL-ul backend-ului baked în bundle:

```bash
gcloud builds submit ./frontend \
  --config=cloudbuild-frontend.yaml \
  --substitutions=_REGION=$REGION,_PROJECT_ID=$PROJECT_ID,_API_URL=$BACKEND_URL
```

Deploy:

```bash
gcloud run deploy caregiver-frontend \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/caregiver/caregiver-frontend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --memory=256Mi \
  --cpu=1

export FRONTEND_URL=$(gcloud run services describe caregiver-frontend --region=$REGION --format='value(status.url)')
echo "Frontend URL: $FRONTEND_URL"
```

---

## 8. Verificare în browser (~5 min)

Deschide `$FRONTEND_URL` în Chrome. Testează:

- [ ] Login cu `caregiver / care123` → vezi tabs **Anomalies, All Days, Simulate**, nu vezi Evaluation/Audit
- [ ] Logout → login cu `admin / admin123` → vezi toate cele 5 tabs
- [ ] **Anomalies** încarcă cardurile cu zile + statusuri pe camere
- [ ] Click pe o zi → vezi explicații SHAP
- [ ] **Simulate** — încarcă `data/sample_day.csv` → primești rezultat anomaly detection
- [ ] **Evaluation** (admin) → vezi tabelul Precision/Recall/F1
- [ ] **Audit Log** (admin) → vezi loguri cu request-urile tale

---

## 9. Update după modificări (re-deploy)

Modificat backend?

```bash
gcloud builds submit . --config=cloudbuild-backend.yaml \
  --substitutions=_REGION=$REGION,_PROJECT_ID=$PROJECT_ID
gcloud run deploy caregiver-backend \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/caregiver/caregiver-backend:latest \
  --region=$REGION
```

Modificat frontend?

```bash
gcloud builds submit ./frontend --config=cloudbuild-frontend.yaml \
  --substitutions=_REGION=$REGION,_PROJECT_ID=$PROJECT_ID,_API_URL=$BACKEND_URL
gcloud run deploy caregiver-frontend \
  --image=$REGION-docker.pkg.dev/$PROJECT_ID/caregiver/caregiver-frontend:latest \
  --region=$REGION
```

---

## Troubleshooting

**`gcloud: command not found`** → `brew install --cask google-cloud-sdk` apoi închide+redeschide terminalul.

**Build eșuează cu „Could not connect to MongoDB"** → IP-ul Cloud Build nu e whitelisted în Atlas. Pune `0.0.0.0/0` în Atlas → Network Access.

**Backend pornește dar `/days` returnează 500** → MongoDB nu e populat. Rulează `python -m src.pipeline` local din `ml-pipeline/` cu `MONGO_URI` setat.

**Frontend afișează pagină albă** → deschide DevTools → Network. Dacă request-urile merg la `http://localhost:8000` în loc de Cloud Run URL, înseamnă că build-ul nu a primit `VITE_API_BASE_URL`. Re-rulează `gcloud builds submit ./frontend ... --substitutions=...,_API_URL=$BACKEND_URL`.

**CORS errors** → backend-ul are deja `allow_origins=["*"]` (vezi `backend/app/main.py:14`). Dacă tot ai erori, verifică să nu fie un proxy între tine și Cloud Run.

**„Permission denied" la `gcloud builds submit`** → contul tău nu are rolul. Rulează:
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=user:$(gcloud config get-value account) \
  --role=roles/cloudbuild.builds.editor
```

**Cost estimat** — pentru un proiect de facultate cu zero trafic real: ~$0/lună. Cloud Run scalează la 0 când nu vine niciun request, deci nu plătești decât pe builds (~$0.003 fiecare). Cu $300 credit ești în siguranță până în iulie 2026.

---

## Bonus: ce să-i spui lui Raul / Teodora / Miruna

> *„Aplicația e live la `$FRONTEND_URL`. Backend la `$BACKEND_URL`. Folosește credentialele din README. MongoDB e cel pe care l-ai configurat tu (Raul). Nu trebuie să rulați nimic local."*

Și pe Slack/Discord copy-paste din output-ul `gcloud run services list --region=$REGION`.
