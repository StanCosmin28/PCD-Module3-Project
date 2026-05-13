# ML Pipeline — Anomaly Detection with Explainability

## What This Does

Detects anomalous days in elderly daily routines using an Isolation Forest, then explains each anomaly using SHAP (which time slots in which rooms deviated from normal).

## Dataset

### Training Data — CASAS Aruba Raw Sensor Events

- **Source**: https://zenodo.org/records/15708568 (file `data.zip`, we extract only `aruba.csv`)
- **Format**: CSV with columns `date, time, room_name, state`
- **Size**: 1.6M sensor events, 220 days (2010-11-04 to 2011-06-11)
- **Rooms**: Bathroom, Bedroom, Kitchen, LivingRoom (+ DiningRoom, GuestRoom, etc. mapped to the 4 main rooms)
- **States**: ON, OFF, OPEN, CLOSE
- **Used for training**: 169 days (the days NOT in the test set)

### Test Data — Llumiguano et al. Zenodo Test Set

- **Source**: https://zenodo.org/records/15800764 (file `CASAS.zip`)
- **Published alongside**: "Unsupervised convolutional neural networks using home presence sensors for behavioural anomaly detection in older adults" (https://pure.qub.ac.uk/en/publications/unsupervised-convolutional-neural-networks-using-home-presence-se/)
- **Format**: Pre-computed features (96 time-slot columns = 15-min intervals across 24h) + ground truth labels per room
- **Size**: 128 test days per room, with synthetic anomalies injected
- **4 rooms evaluated independently**: BATHROOM, BEDROOM, KITCHEN, LIVING_ROOM
- **Ground truth**: `y_true_{ROOM}_ARUBA.csv` — binary label (0=normal, 1=anomaly) per day

### Why This Is a Valid Comparison

Llumiguano et al. trained their models (Convolutional Autoencoder, Isolation Forest, OC-SVM) on the same CASAS Aruba data and evaluated on this exact test set. By using their published test set with the same ground truth labels, our results are directly comparable — no differences in evaluation protocol, dataset split, or feature format.

## How It Works

### Training Phase (the ML pipeline — already done)

1. **Parse raw data** (`data_parser.py`): Reads `aruba.csv`, maps room-level sensor names (Bathroom, Kitchen, LivingRoom, etc.) to 4 standardized rooms (BATHROOM, BEDROOM, KITCHEN, LIVING_ROOM)
2. **Compute features** (`data_parser.py`): For each day, counts how many ON/OPEN activations happened in each 15-minute time slot per room. Result: 96 features per room per day (96 slots × 24h ÷ 15min = 96)
3. **Scale features** (`model.py`): A `StandardScaler` learns the mean and standard deviation of each feature across all training days. It then normalizes the data so all rooms/slots are on the same scale. Without this, a room with 200 daily activations would dominate over one with 5.
4. **Train Isolation Forest** (`model.py`): Learns which daily patterns are "normal". Parameters: `n_estimators=100`, `contamination=0.05`, `random_state=42`. One model per room.
5. **Save models** (`model.py`): Each room's trained model + scaler + feature names saved as `model_{ROOM}.joblib`

### Evaluation Phase (also part of the pipeline)

1. **Load Zenodo test set** (`data_parser.py`): The 128-day test set with pre-computed features (same 96-slot format we produce from raw data)
2. **Predict** (`model.py`): Scale test features using the training scaler, then classify each day as normal or anomaly
3. **Compute metrics** (`evaluate.py`): Compare predictions against ground truth labels → Precision, Recall, F1-Score, confusion matrix
4. **Generate explanations** (`explainer.py`): For each detected anomaly, SHAP TreeExplainer identifies which time slots contributed most to the anomaly score
5. **Build comparison table** (`evaluate.py`): Places our results next to Llumiguano et al.'s reported metrics


## Output Files

All in `ml-pipeline/outputs/`:


## How to Run Locally

### Prerequisites

- Python 3.12 (the venv was created with mise's Python 3.12.11)
- ~100MB disk space for data + outputs

### First-Time Setup

```bash
cd /Users/teov/Documents/Master/PCD/TemaPaper/project

# Create virtual environment (already done, skip if venv/ exists)
python3 -m venv venv

# Install dependencies
./venv/bin/pip install -r ml-pipeline/requirements.txt

# Download datasets (~12MB aruba.csv + 89KB test set)
chmod +x data/download.sh
./data/download.sh
```

### Run the ML Pipeline

```bash
cd /Users/teov/Documents/Master/PCD/TemaPaper/project/ml-pipeline
../venv/bin/python -m src.pipeline
```

This takes ~30-60 seconds and produces all outputs in `ml-pipeline/outputs/`.

