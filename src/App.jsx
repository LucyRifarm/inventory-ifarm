import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
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
const STATUSES = ["Available", "Reserved", "In Transit", "In Use", "In Repair", "Missing"];
const STORAGE_KEY = "inventory-control-items-v6";
const COMPANY_NAME = "i-Farm Inc";
const TYPE_COLORS = {
  Scale: "#3b82f6",
  Printer: "#6b7280",
  Phone: "#8b5cf6",
};

const EMPTY_FORM = {
  type: "Scale",
  id: "",
  manufacturerSN: "",
  model: "",
  location: "Warehouse",
  status: "Available",
  assignedTo: "",
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 24,
    fontFamily: "Inter, Arial, sans-serif",
    color: "#0f172a",
  },
  shell: {
    maxWidth: 1280,
    margin: "0 auto",
    display: "grid",
    gap: 20,
  },
  row: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #cbd5e1",
    background: "white",
    padding: "10px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  buttonPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #0f172a",
    background: "#0f172a",
    color: "white",
    padding: "10px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  card: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
  },
  cardPad: {
    padding: 18,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 800,
  },
  inputWrap: {
    position: "relative",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: 14,
    padding: "11px 14px",
    fontSize: 14,
    background: "white",
  },
  iconInput: {
    paddingLeft: 38,
  },
  tabs: {
    display: "flex",
    gap: 8,
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 6,
    width: "fit-content",
  },
  tab: {
    border: "none",
    borderRadius: 12,
    padding: "10px 14px",
    background: "transparent",
    cursor: "pointer",
    fontWeight: 700,
  },
  tabActive: {
    background: "#0f172a",
    color: "white",
  },
  itemGrid: {
    display: "grid",
    gap: 14,
  },
  itemCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "center",
    flexWrap: "wrap",
  },
  itemMeta: {
    display: "grid",
    gap: 4,
  },
  badge: {
    display: "inline-block",
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    background: "#eef2ff",
    border: "1px solid #dbeafe",
    fontWeight: 700,
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 50,
  },
  modal: {
    width: "100%",
    maxWidth: 760,
    maxHeight: "90vh",
    overflow: "auto",
    background: "white",
    borderRadius: 22,
    border: "1px solid #e2e8f0",
    boxShadow: "0 20px 40px rgba(15,23,42,0.18)",
    padding: 20,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  label: {
    display: "grid",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: 980,
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "1px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 700,
  },
  td: {
    padding: "12px 10px",
    borderBottom: "1px solid #e2e8f0",
    verticalAlign: "top",
  },
  select: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    background: "white",
  },
  qrBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
};

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...styles.row, justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 20 }}>{title}</h3>
          <button onClick={onClose} style={styles.button}>
            <X size={16} />
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ ...styles.card, ...styles.cardPad }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 14, fontWeight: 700 }}>
        {icon}
        {label}
      </div>
      <div style={{ ...styles.statNumber, color: color || "#0f172a", marginTop: 8 }}>{value}</div>
    </div>
  );
}

function LabeledInput({ label, children }) {
  return <label style={styles.label}>{label}{children}</label>;
}

export default function InventoryControlApp() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [search, setSearch] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [activeTab, setActiveTab] = useState("cards");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [
        item.id,
        item.type,
        item.manufacturerSN,
        item.model,
        item.location,
        item.status,
        item.assignedTo,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [items, search]);

  const stats = useMemo(() => ({
    total: items.length,
    scales: items.filter((i) => i.type === "Scale").length,
    printers: items.filter((i) => i.type === "Printer").length,
    phones: items.filter((i) => i.type === "Phone").length,
  }), [items]);

  function generateNextId(type) {
    const prefix = TYPE_PREFIX[type];
    const numbers = items
      .filter((i) => i.type === type)
      .map((i) => parseInt(String(i.id || "").split("-")[1] || "0", 10))
      .filter((n) => !Number.isNaN(n));
    const next = (Math.max(0, ...numbers) + 1).toString().padStart(3, "0");
    return `${prefix}-${next}`;
  }

  function handleAddItem() {
    const id = (form.id || generateNextId(form.type)).trim().toUpperCase();
    if (!id) return;
    setItems((prev) => [
      {
        ...form,
        id,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setForm(EMPTY_FORM);
    setShowAddModal(false);
  }

  function updateItemField(id, field, value) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function deleteItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function startCamera() {
    try {
      setShowScannerModal(true);
      setScanResult("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const scanLoop = async () => {
          if (!videoRef.current || !showScannerModal) return;
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0) {
              const code = results[0].rawValue;
              setScanResult(code);
              setSearch(code);
              stopCamera();
              return;
            }
          } catch {
            // keep scanning
          }
          scanLoopRef.current = requestAnimationFrame(scanLoop);
        };
        scanLoopRef.current = requestAnimationFrame(scanLoop);
      } else {
        setScanResult("Camera opened. This browser does not support automatic QR detection yet.");
      }
    } catch (error) {
      setShowScannerModal(false);
      setScanResult("Camera access failed. Please check browser permissions.");
      console.error(error);
    }
  }

  function stopCamera() {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowScannerModal(false);
  }

  function printLabel(item) {
    const w = window.open("", "_blank", "width=420,height=520");
    if (!w) return;
    const color = TYPE_COLORS[item.type] || "#0f172a";
    w.document.write(`
      <html>
        <head>
          <title>${item.id} Label</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            .label { width: 220px; border: 1px solid #111827; border-radius: 14px; padding: 14px; text-align: center; }
            .company { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
            .type { font-size: 12px; font-weight: 700; color: ${color}; margin-bottom: 10px; }
            .id { font-size: 18px; font-weight: 700; margin-top: 10px; }
            .sn { font-size: 11px; margin-top: 8px; color: #475569; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="company">${COMPANY_NAME}</div>
            <div class="type">${item.type}</div>
            <div>${document.getElementById(`qr-${item.id}`)?.outerHTML || ""}</div>
            <div class="id">${item.id}</div>
            <div class="sn">${item.manufacturerSN ? `SN: ${item.manufacturerSN}` : ""}</div>
          </div>
          <script>window.onload = () => window.print();<\/script>
        </body>
      </html>
    `);
    w.document.close();
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.row}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32 }}>{COMPANY_NAME} Inventory</h1>
            <p style={{ margin: "6px 0 0", color: "#64748b" }}>Deployment-safe version with field view and admin data view.</p>
          </div>
          <div style={styles.actions}>
            <button style={styles.button} onClick={startCamera}>
              <Camera size={16} />
              Scan QR
            </button>
            <button style={styles.buttonPrimary} onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add Item
            </button>
          </div>
        </div>

        <div style={styles.statGrid}>
          <StatCard label="Total Assets" value={stats.total} icon={<Package size={16} />} />
          <StatCard label="Scales" value={stats.scales} color={TYPE_COLORS.Scale} />
          <StatCard label="Printers" value={stats.printers} color={TYPE_COLORS.Printer} />
          <StatCard label="Phones" value={stats.phones} color={TYPE_COLORS.Phone} />
        </div>

        <div style={{ ...styles.card, ...styles.cardPad }}>
          <div style={styles.inputWrap}>
            <Search size={16} style={{ position: "absolute", left: 14, top: 13, color: "#94a3b8" }} />
            <input
              style={{ ...styles.input, ...styles.iconInput }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, serial number, model, location, status, or assignee"
            />
          </div>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(activeTab === "cards" ? styles.tabActive : {}) }}
            onClick={() => setActiveTab("cards")}
          >
            Field View
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === "admin" ? styles.tabActive : {}) }}
            onClick={() => setActiveTab("admin")}
          >
            Admin View
          </button>
        </div>

        {activeTab === "cards" ? (
          <div style={styles.itemGrid}>
            {filteredItems.map((item) => (
              <div key={item.id} style={{ ...styles.card, ...styles.cardPad }}>
                <div style={styles.itemCard}>
                  <div style={styles.itemMeta}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800 }}>{item.id}</span>
                      <span style={{ ...styles.badge, color: TYPE_COLORS[item.type], borderColor: TYPE_COLORS[item.type] }}>{item.type}</span>
                    </div>
                    <div style={{ color: "#475569", fontSize: 14 }}>SN: {item.manufacturerSN || "—"}</div>
                    <div style={{ color: "#475569", fontSize: 14 }}>Model: {item.model || "—"}</div>
                    <div style={{ color: "#475569", fontSize: 14 }}>Location: {item.location || "—"}</div>
                    <div style={{ color: "#475569", fontSize: 14 }}>Status: {item.status || "—"}</div>
                    <div style={{ color: "#475569", fontSize: 14 }}>Assigned To: {item.assignedTo || "—"}</div>
                  </div>

                  <div style={styles.qrBox}>
                    <QRCodeSVG id={`qr-${item.id}`} value={item.id} size={92} />
                    <button style={styles.button} onClick={() => printLabel(item)}>
                      <Printer size={16} />
                      Label
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div style={{ ...styles.card, ...styles.cardPad, textAlign: "center", color: "#64748b" }}>No data found.</div>
            )}
          </div>
        ) : (
          <div style={{ ...styles.card, ...styles.cardPad }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontWeight: 800 }}>
              <Database size={16} />
              Full Asset Data
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Manufacturer SN</th>
                    <th style={styles.th}>Model</th>
                    <th style={styles.th}>Location</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Assigned To</th>
                    <th style={styles.th}>QR</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.td}><strong>{item.id}</strong></td>
                      <td style={styles.td}><span style={{ color: TYPE_COLORS[item.type], fontWeight: 700 }}>{item.type}</span></td>
                      <td style={styles.td}>
                        <input
                          style={styles.input}
                          value={item.manufacturerSN || ""}
                          onChange={(e) => updateItemField(item.id, "manufacturerSN", e.target.value)}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          style={styles.input}
                          value={item.model || ""}
                          onChange={(e) => updateItemField(item.id, "model", e.target.value)}
                        />
                      </td>
                      <td style={styles.td}>
                        <select
                          style={styles.select}
                          value={item.location || "Warehouse"}
                          onChange={(e) => updateItemField(item.id, "location", e.target.value)}
                        >
                          {LOCATIONS.map((location) => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </select>
                      </td>
                      <td style={styles.td}>
                        <select
                          style={styles.select}
                          value={item.status || "Available"}
                          onChange={(e) => updateItemField(item.id, "status", e.target.value)}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td style={styles.td}>
                        <input
                          style={styles.input}
                          value={item.assignedTo || ""}
                          onChange={(e) => updateItemField(item.id, "assignedTo", e.target.value)}
                        />
                      </td>
                      <td style={styles.td}><QRCodeSVG value={item.id} size={50} /></td>
                      <td style={styles.td}>
                        <button style={styles.button} onClick={() => deleteItem(item.id)}>
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Item">
          <div style={styles.formGrid}>
            <LabeledInput label="Type">
              <select style={styles.select} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </LabeledInput>

            <LabeledInput label="Internal ID">
              <input
                style={styles.input}
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="Leave blank for auto-ID"
              />
            </LabeledInput>

            <LabeledInput label="Manufacturer SN">
              <input
                style={styles.input}
                value={form.manufacturerSN}
                onChange={(e) => setForm({ ...form, manufacturerSN: e.target.value })}
              />
            </LabeledInput>

            <LabeledInput label="Model">
              <input
                style={styles.input}
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </LabeledInput>

            <LabeledInput label="Location">
              <select style={styles.select} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                {LOCATIONS.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </LabeledInput>

            <LabeledInput label="Status">
              <select style={styles.select} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </LabeledInput>

            <LabeledInput label="Assigned To">
              <input
                style={styles.input}
                value={form.assignedTo}
                onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              />
            </LabeledInput>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button style={styles.buttonPrimary} onClick={handleAddItem}>
              <Package size={16} />
              Save Item
            </button>
          </div>
        </Modal>

        <Modal open={showScannerModal} onClose={stopCamera} title="Scan QR">
          <div style={{ display: "grid", gap: 14 }}>
            <video ref={videoRef} style={{ width: "100%", borderRadius: 18, background: "black" }} playsInline muted />
            <input style={styles.input} value={scanResult} readOnly placeholder="Scan result will appear here" />
          </div>
        </Modal>
      </div>
    </div>
  );
}

