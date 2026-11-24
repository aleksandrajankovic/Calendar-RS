"use client";
// Na telefonu admin panel kreće skupljen (samo "Admin" traka), da ne prekriva kalendar.
import { useEffect } from "react";

export default function AdminPanelCollapse({ targetId }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (el && matchMedia("(max-width: 767px)").matches) el.open = false;
  }, [targetId]);
  return null;
}
