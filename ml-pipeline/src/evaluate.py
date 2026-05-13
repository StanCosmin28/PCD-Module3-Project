import numpy as np
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
from pathlib import Path
import json


def evaluate_room(predictions: np.ndarray, labels: pd.DataFrame) -> dict:
    y_true = labels["y_true"].values
    y_pred = predictions

    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()

    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "true_positives": int(tp),
        "false_positives": int(fp),
        "true_negatives": int(tn),
        "false_negatives": int(fn),
        "total_samples": len(y_true),
        "total_anomalies": int(y_true.sum()),
        "predicted_anomalies": int(y_pred.sum()),
    }


LLUMIGUANO_RESULTS = {
    "Autoencoder_P90": {
        "BATHROOM": {"precision": 0.85, "recall": 1.00, "f1_score": 0.92},
        "BEDROOM": {"precision": 0.73, "recall": 1.00, "f1_score": 0.85},
        "KITCHEN": {"precision": 0.88, "recall": 1.00, "f1_score": 0.94},
        "LIVING_ROOM": {"precision": 0.86, "recall": 1.00, "f1_score": 0.93},
    },
    "Autoencoder_P98": {
        "BATHROOM": {"precision": 1.00, "recall": 1.00, "f1_score": 1.00},
        "BEDROOM": {"precision": 0.93, "recall": 1.00, "f1_score": 0.96},
        "KITCHEN": {"precision": 0.96, "recall": 1.00, "f1_score": 0.98},
        "LIVING_ROOM": {"precision": 0.95, "recall": 1.00, "f1_score": 0.98},
    },
    "Isolation_Forest": {
        "BATHROOM": {"precision": 0.97, "recall": 0.80, "f1_score": 0.87},
        "BEDROOM": {"precision": 0.97, "recall": 0.80, "f1_score": 0.87},
        "KITCHEN": {"precision": 0.97, "recall": 0.80, "f1_score": 0.87},
        "LIVING_ROOM": {"precision": 0.97, "recall": 0.80, "f1_score": 0.87},
    },
    "OC_SVM": {
        "BATHROOM": {"precision": 0.79, "recall": 1.00, "f1_score": 0.88},
        "BEDROOM": {"precision": 0.79, "recall": 1.00, "f1_score": 0.88},
        "KITCHEN": {"precision": 0.79, "recall": 1.00, "f1_score": 0.88},
        "LIVING_ROOM": {"precision": 0.79, "recall": 1.00, "f1_score": 0.88},
    },
}


def build_comparison_table(our_results: dict) -> pd.DataFrame:
    rows = []
    for room in our_results:
        row = {"room": room}
        ours = our_results[room]
        row["our_IF_SHAP_precision"] = ours["precision"]
        row["our_IF_SHAP_recall"] = ours["recall"]
        row["our_IF_SHAP_f1"] = ours["f1_score"]

        for method, method_results in LLUMIGUANO_RESULTS.items():
            if room in method_results:
                row[f"{method}_precision"] = method_results[room]["precision"]
                row[f"{method}_recall"] = method_results[room]["recall"]
                row[f"{method}_f1"] = method_results[room]["f1_score"]

        rows.append(row)

    return pd.DataFrame(rows)


def save_results(our_results: dict, comparison_table: pd.DataFrame, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(output_dir / "evaluation_results.json", "w") as f:
        json.dump(our_results, f, indent=2)

    comparison_table.to_csv(output_dir / "comparison_table.csv", index=False)

    print("\n=== Evaluation Results ===")
    for room, metrics in our_results.items():
        print(f"\n{room}:")
        print(f"  Precision: {metrics['precision']}")
        print(f"  Recall:    {metrics['recall']}")
        print(f"  F1-Score:  {metrics['f1_score']}")
        print(f"  TP={metrics['true_positives']} FP={metrics['false_positives']} "
              f"TN={metrics['true_negatives']} FN={metrics['false_negatives']}")

    print("\n=== Comparison Table ===")
    print(comparison_table.to_string(index=False))
