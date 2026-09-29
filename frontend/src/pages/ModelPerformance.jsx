import React, { useState, useEffect } from 'react';
import { fetchModelMetrics } from '../services/api';
import { Cpu, BarChart2, ShieldCheck, Zap } from 'lucide-react';

export function ModelPerformance() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelMetrics()
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Error fetching metrics:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading evaluation benchmarks...</div>;

  const models = [
    { key: 'rule_based', name: 'Deterministic Rule QC', desc: 'WMO-No. 8 physical limits & rate-of-change step checks' },
    { key: 'isolation_forest', name: 'Isolation Forest (Baseline)', desc: 'Unsupervised subspace isolation on 29 temporal features' },
    { key: 'lstm_autoencoder', name: 'Deep LSTM Autoencoder', desc: 'Sequence reconstruction error (seq_len=24, hidden_dim=32)' },
    { key: 'skyguard_hybrid', name: 'SkyGuard AI Hybrid Engine', desc: 'Physics-informed Bayesian decision fusion + Weather event protection' }
  ];

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Cpu size={18} color="var(--accent-cyan)" />
            <span>Operational ML Model Performance & Comparative Benchmark</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Evaluated on continuous 600-step test bench with ground truth annotated faults
          </span>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
          Standard statistical and unsupervised ML models (Isolation Forest, Autoencoders) suffer from high false-positive rates
          during genuine heatwaves because extreme weather is statistically rare. SkyGuard AI integrates thermodynamic coupling
          (Clausius-Clapeyron Magnus relation) and spatial neighborhood consensus to drastically slash false alarms.
        </p>
      </div>

      {/* Model Benchmark Comparative Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <BarChart2 size={18} color="var(--accent-cyan)" />
            <span>Multi-Model Evaluation Matrix</span>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model Architecture</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1-Score</th>
                <th>False Positive Rate (FPR)</th>
                <th>Avg Latency</th>
                <th>Confusion Matrix (TP / FP / TN / FN)</th>
              </tr>
            </thead>
            <tbody>
              {models.map(m => {
                const data = metrics?.[m.key] || {};
                const cm = data.confusion_matrix || { tp: 0, fp: 0, tn: 0, fn: 0 };
                const isHybrid = m.key === 'skyguard_hybrid';

                return (
                  <tr key={m.key} style={{ background: isHybrid ? 'rgba(6, 182, 212, 0.05)' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: 600, color: isHybrid ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                        {m.name} {isHybrid && <span style={{ fontSize: '0.7rem', padding: '1px 5px', background: '#0284c7', color: '#fff', borderRadius: '3px' }}>OPTIMAL</span>}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{data.precision !== undefined ? data.precision.toFixed(3) : '--'}</td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>{data.recall !== undefined ? data.recall.toFixed(3) : '--'}</td>
                    <td className="font-mono" style={{ fontWeight: 700, color: isHybrid ? '#10b981' : 'var(--text-primary)' }}>
                      {data.f1 !== undefined ? data.f1.toFixed(3) : '--'}
                    </td>
                    <td className="font-mono" style={{ color: (data.false_positive_rate || 0) < 0.02 ? '#10b981' : '#f59e0b' }}>
                      {data.false_positive_rate !== undefined ? `${(data.false_positive_rate * 100).toFixed(2)}%` : '--'}
                    </td>
                    <td className="font-mono" style={{ color: '#38bdf8' }}>
                      {data.avg_inference_latency_ms !== undefined ? `${data.avg_inference_latency_ms.toFixed(2)} ms` : '--'}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                      TP:{cm.tp} | FP:{cm.fp} | TN:{cm.tn} | FN:{cm.fn}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engineering Insights Card */}
      <div className="panel" style={{ background: 'var(--bg-subtle)' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
          WHY ISOLATION FOREST & AUTOENCODERS ALONE ARE INSUFFICIENT FOR METEOROLOGY:
        </h4>
        <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
          <li>
            <strong>False Positives on Extreme Weather:</strong> Heatwaves, cold fronts, and thunderstorm downdrafts are statistical outliers. Unsupervised models flag them as anomalies, falsely condemning functional sensors.
          </li>
          <li>
            <strong>Physical Unawareness:</strong> An Isolation Forest cannot evaluate whether a +6°C rise in temperature with a corresponding -20% drop in Relative Humidity obeys Clausius-Clapeyron saturation vapor thermodynamics.
          </li>
          <li>
            <strong>SkyGuard AI Solution:</strong> Combines deterministic fast checks, physics consistency gates, spatial consensus among neighboring AWS units, and calibrated LSTM reconstruction error into an auditable Bayesian decision fusion layer.
          </li>
        </ul>
      </div>
    </div>
  );
}
