import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { I } from "../lib/icons";
import { MEASUREMENT_FIELDS } from "../lib/constants";

export default function MeasurementsModal({ open, onClose, onSave, initial = {}, title = "Custom measurements" }) {
  const [unit, setUnit] = useState(initial.unit || "in");
  const [vals, setVals] = useState({});

  useEffect(() => {
    if (open) {
      setUnit(initial.unit || "in");
      const init = {};
      MEASUREMENT_FIELDS.forEach((f) => { init[f.id] = initial[f.id] != null ? String(initial[f.id]) : ""; });
      setVals(init);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleSave = () => {
    const out = { unit };
    MEASUREMENT_FIELDS.forEach((f) => {
      const v = parseFloat(vals[f.id]);
      if (!Number.isNaN(v)) out[f.id] = v;
    });
    onSave(out);
  };

  return (
    <AnimatePresence>
      <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="modal" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }} onClick={(e) => e.stopPropagation()} data-testid="measurements-modal">
          <div className="left">
            <span className="eyebrow">Bespoke fit</span>
            <h3>Tell us your measurements</h3>
            <div className="figure">
              <svg viewBox="0 0 200 320" width="100%" height="100%" style={{ display: "block" }}>
                <g fill="none" stroke="var(--ink)" strokeWidth="1.2" opacity="0.5">
                  <ellipse cx="100" cy="40" rx="22" ry="26"/>
                  <path d="M70 80 Q100 76 130 80 L138 110 L150 200 L138 290 L120 305 L100 295 L80 305 L62 290 L50 200 L62 110 Z"/>
                  <line x1="100" y1="80" x2="100" y2="295"/>
                  <line x1="62" y1="110" x2="138" y2="110" strokeDasharray="2 4"/>
                  <line x1="60" y1="160" x2="140" y2="160" strokeDasharray="2 4"/>
                  <line x1="58" y1="210" x2="142" y2="210" strokeDasharray="2 4"/>
                </g>
                <g fontSize="9" fill="var(--ink-3)" fontFamily="JetBrains Mono">
                  <text x="146" y="113">BUST</text>
                  <text x="146" y="163">WAIST</text>
                  <text x="146" y="213">HIP</text>
                </g>
              </svg>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: 0 }}>If you have any garment that fits perfectly, lay it flat and measure across — this is often the fastest way to get accurate numbers.</p>
          </div>
          <div className="right">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>{title}</h3>
              <button className="btn btn-link" onClick={onClose} aria-label="Close" data-testid="measurements-close-btn"><I.close/></button>
            </div>
            <p className="sub">All measurements in {unit === "in" ? "inches" : "centimetres"}. Saved to your profile.</p>
            <div className="unit-toggle">
              <button className={unit === "in" ? "active" : ""} onClick={() => setUnit("in")} data-testid="unit-in-btn">Inches</button>
              <button className={unit === "cm" ? "active" : ""} onClick={() => setUnit("cm")} data-testid="unit-cm-btn">Centimetres</button>
            </div>
            <div className="grid2">
              {MEASUREMENT_FIELDS.map((f) => (
                <label key={f.id} className="field">
                  {f.label}
                  <input
                    type="number"
                    step="0.1"
                    placeholder="—"
                    value={vals[f.id] || ""}
                    onChange={(e) => setVals((v) => ({ ...v, [f.id]: e.target.value }))}
                    data-testid={`measurement-${f.id}-input`}
                  />
                </label>
              ))}
            </div>
            <div className="footer-row">
              <button className="btn btn-link" onClick={onClose} data-testid="measurements-cancel-btn">Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} data-testid="measurements-save-btn">Save measurements <I.arrow/></button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
