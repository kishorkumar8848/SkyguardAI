import os
import sys
import json
import matplotlib.pyplot as plt
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.ml.benchmarks import ModelBenchmarkSuite

def main():
    print("Running comprehensive model benchmarking suite...")
    suite = ModelBenchmarkSuite(model_dir="./models/saved")
    results = suite.run_benchmark()

    os.makedirs("./models/saved", exist_ok=True)
    os.makedirs("./docs", exist_ok=True)

    # Save metrics.json
    metrics_path = "./models/saved/metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(results["models"], f, indent=2)
    print(f"[OK] Saved {metrics_path}")

    # Save latency_report.json
    latencies = {
        model_name: {
            "avg_inference_latency_ms": data["avg_inference_latency_ms"],
            "p95_latency_ms": data["p95_latency_ms"]
        }
        for model_name, data in results["models"].items()
    }
    lat_path = "./models/saved/latency_report.json"
    with open(lat_path, "w") as f:
        json.dump(latencies, f, indent=2)
    print(f"[OK] Saved {lat_path}")

    # Generate Confusion Matrix comparison chart
    try:
        fig, axes = plt.subplots(2, 2, figsize=(10, 8))
        names = ["rule_based", "isolation_forest", "lstm_autoencoder", "skyguard_hybrid"]
        titles = ["Rule-based QC", "Isolation Forest", "LSTM Autoencoder", "SkyGuard AI Hybrid"]

        for ax, name, title in zip(axes.flatten(), names, titles):
            cm = results["models"][name]["confusion_matrix"]
            mat = np.array([[cm["tn"], cm["fp"]], [cm["fn"], cm["tp"]]])
            im = ax.imshow(mat, cmap="Blues")
            ax.set_title(f"{title}\nF1: {results['models'][name]['f1']:.3f} | Latency: {results['models'][name]['avg_inference_latency_ms']:.2f}ms")
            ax.set_xlabel("Predicted")
            ax.set_ylabel("Actual")
            ax.set_xticks([0, 1])
            ax.set_yticks([0, 1])
            ax.set_xticklabels(["Normal", "Anomaly"])
            ax.set_yticklabels(["Normal", "Anomaly"])
            for i in range(2):
                for j in range(2):
                    ax.text(j, i, str(mat[i, j]), ha="center", va="center", color="red" if i != j else "black", fontweight="bold")

        plt.tight_layout()
        plt.savefig("./models/saved/confusion_matrix.png", dpi=150)
        plt.close()
        print("[OK] Saved ./models/saved/confusion_matrix.png")
    except Exception as e:
        print(f"Plotting error: {e}")

    # Output summary table
    print("\n" + "="*80)
    print("SKYGUARD AI MODEL BENCHMARK RESULTS")
    print("="*80)
    print(f"{'Model':<22} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'FPR':<8} | {'Latency':<10}")
    print("-" * 80)
    for model_name, m in results["models"].items():
        print(f"{model_name:<22} | {m['precision']:<10.4f} | {m['recall']:<10.4f} | {m['f1']:<10.4f} | {m['false_positive_rate']:<8.4f} | {m['avg_inference_latency_ms']:<8.2f}ms")
    print("="*80)

if __name__ == "__main__":
    main()
