import React from "react";
import { inputStyle, labelStyle } from "./Input";

export default function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={labelStyle}>{label}</label>}
      <select style={inputStyle} {...props}>{children}</select>
    </div>
  );
}
