import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import jsQR from "jsqr";
import { createClient } from "@supabase/supabase-js";
import {
  Camera,
  Database,
  Package,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from "lucide-react";

const TYPES = ["Scale", "Printer", "Phone"];
const TYPE_PREFIX = { Scale: "SC", Printer: "PR", Phone: "PH" };
const LOCATIONS = ["Warehouse", "Office", "Transit", "Customer Site"];
const STATUSES = ["Available", "Reserved", "In Transit", "In Use", "In Repair", "Missing", "Sold"];
const STORAGE_KEY = "inventory-control-items-v6";
const COMPANY_NAME = "i-Farm Inc";
const LOGO_URL = "/ifarm-logo.png";
const CONTACT_PHONE = "(509) 537-6076";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const TYPE_COLORS = {
  Scale: "#173eab",
  Printer: "#5078e7",
  Phone: "#8fa8ff",
};

const EMPTY_FORM = {
  type: "Scale",
  id: "",
  manufacturerSN: "",
  model: "",
  bluetoothName: "",
  location: "Warehouse",
  status: "Available",
  assignedTo: "",
  notes: "",
};

export default function InventoryControlApp() {
  const [connectionMode, setConnectionMode] = useState(
    isSupabaseConfigured ? "Supabase ready" : "Local only"
  );
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function handleAddItem() {
    const id = form.id || `${TYPE_PREFIX[form.type]}-${items.length + 1}`;
    const newItem = { ...form, id };
    setItems([newItem, ...items]);
    setForm(EMPTY_FORM);
    setShowAddModal(false);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>{COMPANY_NAME} Inventory</h1>
      <div style={{ marginBottom: 12, color: "#64748b", fontSize: 14 }}>
        Storage mode: <strong>{connectionMode}</strong>
      </div>

      <button onClick={() => setShowAddModal(true)}>Add Item</button>

      {items.map((item) => (
        <div key={item.id} style={{ border: "1px solid #ccc", margin: 10, padding: 10 }}>
          <strong>{item.id}</strong> - {item.type}
        </div>
      ))}

      {showAddModal && (
        <div>
          <h3>Add Item</h3>
          <input
            placeholder="ID"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
          />
          <button onClick={handleAddItem}>Save</button>
        </div>
      )}
    </div>
  );
}
