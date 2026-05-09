import React from "react";
import { useNavigate } from "react-router-dom";
import { I } from "../lib/icons";

export default function BackButton({ label = "Back", testid = "back-btn" }) {
  const navigate = useNavigate();
  if (window.history.length <= 1) return null;
  return (
    <button className="back-btn" onClick={() => navigate(-1)} data-testid={testid} title="Go back">
      <I.back/> <span>{label}</span>
    </button>
  );
}
