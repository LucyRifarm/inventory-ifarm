import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import jsQR from "jsqr";
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
const LABEL_PRESET = {
  widthIn: 2.625,
  heightIn: 1,
  paddingIn: 0.03,
};
const TYPE_COLORS = {
  Scale: "#3b82f6",
  Printer: "#6b7280",
  Phone: "#8b5cf6",
};
const AVERY_18160 = {
  pageWidthIn: 8.5,
  pageHeightIn: 11,
  labelWidthIn: 2.625,
  labelHeightIn: 1,
  columns: 3,
  rows: 10,
  marginLeftIn: 0.1875,
  marginTopIn: 0.5,
  gapXIn: 0.125,
  gapYIn: 0,
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

const styles = {
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  boardColumn: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    minHeight: 320,
    maxHeight: 560,
  },
  boardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  boardTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#0f172a",
  },
  boardCount: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 999,
    padding: "4px 8px",
  },
  boardBody: {
    display: "grid",
    gap: 10,
    overflowY: "auto",
    paddingRight: 2,
  },
  boardCard: {
    background: "white",
    borderRadius: 14,
    padding: 12,
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    display: "grid",
    gap: 6,
    textAlign: "left",
  },
  boardMetaText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.35,
    wordBreak: "break-word",
  },
  boardEmpty: {
    border: "1px dashed #cbd5e1",
    borderRadius: 14,
    padding: 14,
    textAlign: "center",
    color: "#94a3b8",
    background: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  timelineWrap: {
    marginTop: 20,
    borderTop: "1px solid #e2e8f0",
    paddingTop: 18,
  },
  timelineList: {
    display: "grid",
    gap: 12,
    maxHeight: 260,
    overflowY: "auto",
    paddingRight: 4,
  },
  timelineItem: {
    display: "grid",
    gap: 6,
    padding: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    background: "#f8fafc",
  },
  timelineHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  timelineFieldBadge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 700,
    background: "#e2e8f0",
    color: "#334155",
    textTransform: "capitalize",
  },
  timelineChange: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 1.4,
    wordBreak: "break-word",
  },
  timelineArrow: {
    color: "#94a3b8",
    fontWeight: 800,
    padding: "0 6px",
  },
  timelineEmpty: {
    padding: 16,
    border: "1px dashed #cbd5e1",
    borderRadius: 14,
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
  },
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
    minWidth: 1160,
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

function StatCard({ label, value, color, icon, onClick, isActive = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.card,
        ...styles.cardPad,
        border: isActive ? `2px solid ${color || "#0f172a"}` : styles.card.border,
        cursor: onClick ? "pointer" : "default",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#64748b", fontSize: 14, fontWeight: 700 }}>
        {icon}
        {label}
      </div>
      <div style={{ ...styles.statNumber, color: color || "#0f172a", marginTop: 8 }}>{value}</div>
    </button>
  );
}

function LabeledInput({ label, children }) {
  return (
    <label style={styles.label}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function normalizeUppercaseFields(field, value) {
  return ["manufacturerSN", "model", "bluetoothName"].includes(field)
    ? String(value).toUpperCase()
    : value;
}

function generateNextId(type, items) {
  const prefix = TYPE_PREFIX[type];
  const numbers = items
    .filter((i) => i.type === type)
    .map((i) => parseInt(String(i.id || "").split("-")[1] || "0", 10))
    .filter((n) => !Number.isNaN(n));
  const next = (Math.max(0, ...numbers) + 1).toString().padStart(3, "0");
  return `${prefix}-${next}`;
}

function formatHistoryField(field) {
  if (!field) return "Update";
  if (field === "assignedTo") return "Assigned To";
  if (field === "manufacturerSN") return "Manufacturer SN";
  if (field === "bluetoothName") return "Bluetooth Name";
  if (field === "created") return "Created";
  if (field === "notes") return "Notes";
  return field.charAt(0).toUpperCase() + field.slice(1);
}

function formatHistoryValue(value) {
  return value === undefined || value === null || value === "" ? "—" : String(value);
}

function formatPendingFieldLabel(field) {
  return formatHistoryField(field);
}

function PendingChangesSummary({ changes = [] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {changes.map((change, index) => (
        <div key={`${change.field}-${index}`} style={{ ...styles.timelineItem, background: "white" }}>
          <div style={styles.timelineHeader}>
            <span style={styles.timelineFieldBadge}>{formatPendingFieldLabel(change.field)}</span>
          </div>
          <div style={styles.timelineChange}>
            <strong>{formatHistoryValue(change.from)}</strong>
            <span style={styles.timelineArrow}>→</span>
            <strong>{formatHistoryValue(change.to)}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

function BoardView({ items, onOpenItem }) {
  return (
    <div style={styles.board}>
      {STATUSES.map((status) => {
        const statusItems = items.filter((item) => item.status === status);
        return (
          <div key={status} style={styles.boardColumn}>
            <div style={styles.boardHeader}>
              <div style={styles.boardTitle}>{status}</div>
              <div style={styles.boardCount}>{statusItems.length}</div>
            </div>

            <div style={styles.boardBody}>
              {statusItems.length === 0 ? (
                <div style={styles.boardEmpty}>No items here.</div>
              ) : (
                statusItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    style={styles.boardCard}
                    onClick={() => onOpenItem(item.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 800 }}>{item.id}</span>
                      <span
                        style={{
                          ...styles.badge,
                          color: TYPE_COLORS[item.type],
                          borderColor: TYPE_COLORS[item.type],
                          width: "fit-content",
                        }}
                      >
                        {item.type}
                      </span>
                    </div>
                    <div style={styles.boardMetaText}><strong>Location:</strong> {item.location || "—"}</div>
                    <div style={styles.boardMetaText}><strong>Assigned:</strong> {item.assignedTo || "—"}</div>
                    <div style={styles.boardMetaText}><strong>Notes:</strong> {item.notes || "—"}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HistoryTimeline({ history = [] }) {
  if (!history.length) {
    return <div style={styles.timelineEmpty}>No movement history yet.</div>;
  }

  return (
    <div style={styles.timelineList}>
      {history.map((entry, index) => {
        const isCreated = entry.field === "created";
        return (
          <div key={`${entry.date}-${entry.field}-${index}`} style={styles.timelineItem}>
            <div style={styles.timelineHeader}>
              <span style={styles.timelineFieldBadge}>{formatHistoryField(entry.field)}</span>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                {entry.date ? new Date(entry.date).toLocaleString() : "—"}
              </span>
            </div>
            <div style={styles.timelineChange}>
              {isCreated ? (
                <strong>{formatHistoryValue(entry.to)}</strong>
              ) : (
                <>
                  <strong>{formatHistoryValue(entry.from)}</strong>
                  <span style={styles.timelineArrow}>→</span>
                  <strong>{formatHistoryValue(entry.to)}</strong>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const __testables = { normalizeUppercaseFields, generateNextId, formatHistoryField, formatHistoryValue, formatPendingFieldLabel };

export default function InventoryControlApp() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [search, setSearch] = useState("");
  const [scanResult, setScanResult] = useState("");
  const [activeTab, setActiveTab] = useState("cards");
  const [fieldViewMode, setFieldViewMode] = useState("cards");
  const [bulkType, setBulkType] = useState("All");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("All");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [draftItem, setDraftItem] = useState(null);
  const [pendingChange, setPendingChange] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      setItems(JSON.parse(saved));
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => () => stopCamera(), []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        [
          item.id,
          item.type,
          item.manufacturerSN,
          item.model,
          item.location,
          item.status,
          item.assignedTo,
          item.bluetoothName,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));

      const matchesType = selectedTypeFilter === "All" || item.type === selectedTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [items, search, selectedTypeFilter]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) || null,
    [items, selectedItemId]
  );

  const stats = useMemo(
    () => ({
      total: items.length,
      scales: items.filter((i) => i.type === "Scale").length,
      printers: items.filter((i) => i.type === "Printer").length,
      phones: items.filter((i) => i.type === "Phone").length,
    }),
    [items]
  );

  function exportCSV() {
    const headers = ["ID", "Type", "Location", "Status", "Assigned To", "Model", "SN", "Bluetooth Name", "Last Updated"];
    const rows = items.map((i) => [
      i.id,
      i.type,
      i.location,
      i.status,
      i.assignedTo,
      i.model,
      i.manufacturerSN,
      i.bluetoothName,
      i.lastUpdated,
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleTypeFilter(type) {
    setSelectedTypeFilter((prev) => (prev === type ? "All" : type));
  }

  function handleAddItem() {
    const id = (form.id || generateNextId(form.type, items)).trim().toUpperCase();
    if (!id) return;

    const now = new Date().toISOString();

    setItems((prev) => [
      {
        ...form,
        id,
        manufacturerSN: String(form.manufacturerSN || "").toUpperCase(),
        model: String(form.model || "").toUpperCase(),
        bluetoothName: String(form.bluetoothName || "").toUpperCase(),
        notes: String(form.notes || "").trim(),
        createdAt: now,
        lastUpdated: now,
        history: [
          {
            date: now,
            field: "created",
            from: "",
            to: "Item created",
          },
        ],
      },
      ...prev,
    ]);

    setForm(EMPTY_FORM);
    setShowAddModal(false);
  }

  function applyItemFieldUpdate(id, field, value) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const normalizedValue = normalizeUppercaseFields(field, value);
        const oldValue = item[field];
        if (oldValue === normalizedValue) return item;

        const historyEntry = {
          date: new Date().toISOString(),
          field,
          from: oldValue || "",
          to: normalizedValue || "",
        };

        return {
          ...item,
          [field]: normalizedValue,
          history: [historyEntry, ...(item.history || [])],
          lastUpdated: new Date().toISOString(),
        };
      })
    );
  }

  function updateItemField(id, field, value) {
    setDraftItem((prev) => ({
      ...(prev || {}),
      [field]: normalizeUppercaseFields(field, value),
    }));
  }

  function buildPendingChanges(item, draft) {
    if (!item || !draft) return [];

    return ["status", "location", "assignedTo", "notes"]
      .map((field) => {
        const from = item[field] || "";
        const to = draft[field] || "";
        if (from === to) return null;
        return {
          field,
          from,
          to,
        };
      })
      .filter(Boolean);
  }

  function requestSaveItemUpdates() {
    if (!selectedItem || !draftItem) return;
    const changes = buildPendingChanges(selectedItem, draftItem);
    if (!changes.length) return;

    setPendingChange({
      id: selectedItem.id,
      changes,
    });
  }

  function confirmPendingChange() {
    if (!pendingChange?.changes?.length) return;

    pendingChange.changes.forEach((change) => {
      applyItemFieldUpdate(pendingChange.id, change.field, change.to);
    });

    setPendingChange(null);
    closeItemEditor();
  }

  function cancelPendingChange() {
    setPendingChange(null);
  }

  function handleAdminTextCommit(id, field, value) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;

    const normalizedValue = normalizeUppercaseFields(field, value);
    const oldValue = item[field] || "";
    if (oldValue === normalizedValue) return;

    applyItemFieldUpdate(id, field, normalizedValue);
  }

  function deleteItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  }

  function openItemEditor(id) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    setSelectedItemId(id);
    setDraftItem({
      status: item.status || "Available",
      location: item.location || "Warehouse",
      assignedTo: item.assignedTo || "",
      notes: item.notes || "",
    });
  }

  function closeItemEditor() {
    setSelectedItemId(null);
    setDraftItem(null);
  }

  async function startCamera() {
    try {
      if (videoRef.current) {
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("autoplay", "true");
        videoRef.current.setAttribute("muted", "true");
      }
    } catch {
      // ignore
    }

    try {
      setShowScannerModal(true);
      handleScanResult($1);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const scanLoop = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
          scanLoopRef.current = requestAnimationFrame(scanLoop);
          return;
        }

        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
          scanLoopRef.current = requestAnimationFrame(scanLoop);
          return;
        }

        try {
          if ("BarcodeDetector" in window) {
            const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
            const results = await detector.detect(video);
            if (results.length > 0) {
              handleDecodedValue(results[0].rawValue);
              return;
            }
          }
        } catch {
          // continue to jsQR fallback
        }

        try {
          const context = canvas.getContext("2d", { willReadFrequently: true });
          const scanWidth = video.videoWidth * 0.8;
          const scanHeight = video.videoHeight * 0.8;
          const offsetX = (video.videoWidth - scanWidth) / 2;
          const offsetY = (video.videoHeight - scanHeight) / 2;

          canvas.width = scanWidth;
          canvas.height = scanHeight;
          context.drawImage(video, offsetX, offsetY, scanWidth, scanHeight, 0, 0, scanWidth, scanHeight);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (result?.data) {
            handleDecodedValue(result.data);
            return;
          }
        } catch {
          // keep scanning
        }

        scanLoopRef.current = requestAnimationFrame(scanLoop);
      };

      scanLoopRef.current = requestAnimationFrame(scanLoop);
    } catch (error) {
      setShowScannerModal(false);
      handleScanResult($1);
      console.error(error);
    }
  }

  function handleDecodedValue(rawValue) {
    if (!rawValue) return;
    const value = String(rawValue).trim();
    handleScanResult($1);
    setSearch(value);
    const matchedItem = items.find((item) => String(item.id).toLowerCase() === value.toLowerCase());
    if (matchedItem) setSelectedItemId(matchedItem.id);
    stopCamera();
  }

  async function scanImageFile(file) {
    if (!file) return;
    try {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });

      URL.revokeObjectURL(imageUrl);

      if (result?.data) {
        handleDecodedValue(result.data);
        return;
      }

      handleScanResult($1);
    } catch (error) {
      handleScanResult($1);
      console.error(error);
    }
  }

  function handleScanResult(result) {
  handleScanResult($1);

  const item = items.find((entry) => entry.id === result);
  if (item) {
    openItemEditor(item.id);
  }

  stopCamera();
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

  function getLabelMarkup(item) {
    const color = TYPE_COLORS[item.type] || "#0f172a";
    const safeModel = item.model || "";
    return `
      <div class="label">
        <div class="left">
          <div class="logoWrap">
            <img src="${LOGO_URL}" alt="${COMPANY_NAME}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" crossorigin="anonymous" />
            <div class="companyFallback" style="display:none;">${COMPANY_NAME}</div>
          </div>
          <div class="assetId">${item.id}</div>
          <div class="metaRow">
            <div class="typeText" style="color:${color};">${item.type}</div>
            ${safeModel ? `<div class="model">${safeModel}</div>` : ""}
          </div>
          <div class="phone">${CONTACT_PHONE}</div>
        </div>
        <div class="right">
          <div class="qrBox">${document.getElementById(`qr-${item.id}`)?.outerHTML || ""}</div>
        </div>
      </div>
    `;
  }

  function getPrintStyles() {
    return `
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
        background: white;
      }
      .sheetPage {
        width: ${AVERY_18160.pageWidthIn}in;
        min-height: ${AVERY_18160.pageHeightIn}in;
        padding-top: ${AVERY_18160.marginTopIn}in;
        padding-left: ${AVERY_18160.marginLeftIn}in;
        display: grid;
        grid-template-columns: repeat(${AVERY_18160.columns}, ${AVERY_18160.labelWidthIn}in);
        grid-auto-rows: ${AVERY_18160.labelHeightIn}in;
        column-gap: ${AVERY_18160.gapXIn}in;
        row-gap: ${AVERY_18160.gapYIn}in;
        page-break-after: always;
      }
      .sheetPage:last-child { page-break-after: auto; }
      .labelWrap {
        width: ${AVERY_18160.labelWidthIn}in;
        height: ${AVERY_18160.labelHeightIn}in;
        padding: ${LABEL_PRESET.paddingIn}in;
      }
      .label {
        width: 100%;
        height: 100%;
        border: 1px solid #d1d5db;
        border-radius: 10px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1.5fr 0.9fr;
        background: #ffffff;
      }
      .left {
        padding: 0.07in 0.05in 0.06in 0.08in;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
      }
      .logoWrap {
        height: 0.22in;
        display: flex;
        align-items: center;
        margin-bottom: 0.03in;
      }
      .logoWrap img {
        max-width: 100%;
        max-height: 0.22in;
        object-fit: contain;
        object-position: left center;
        display: block;
      }
      .companyFallback {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: #111827;
      }
      .assetId {
        font-size: 12px;
        line-height: 1;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: 0.01em;
        margin-top: 0.01in;
      }
      .metaRow {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 0.03in;
      }
      .typeText {
        font-weight: 800;
        font-size: 9px;
        white-space: nowrap;
      }
      .model {
        color: #6b7280;
        font-size: 8px;
        line-height: 1.1;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .phone {
        margin-top: 0.03in;
        color: #475569;
        font-size: 8px;
        line-height: 1;
      }
      .right {
        padding: 0.05in 0.06in 0.05in 0.02in;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qrBox {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .qrBox svg {
        width: 100% !important;
        max-width: 0.62in;
        height: auto !important;
      }
      @page {
        size: letter portrait;
        margin: 0;
      }
    `;
  }

  function printBulkLabels() {
    const sourceItems = bulkType === "All" ? filteredItems : filteredItems.filter((item) => item.type === bulkType);
    if (!sourceItems.length) return;

    const labelsPerPage = AVERY_18160.columns * AVERY_18160.rows;
    const pages = [];
    for (let i = 0; i < sourceItems.length; i += labelsPerPage) {
      pages.push(sourceItems.slice(i, i + labelsPerPage));
    }

    const w = window.open("", "_blank", "width=1100,height=900");
    if (!w) return;

    const pageMarkup = pages
      .map(
        (pageItems) => `
          <div class="sheetPage">
            ${pageItems.map((item) => `<div class="labelWrap">${getLabelMarkup(item)}</div>`).join("")}
          </div>
        `
      )
      .join("");

    w.document.write(`
      <html>
        <head>
          <title>Bulk Labels</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body>
          ${pageMarkup}
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
            <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 12 }}>
              Avery 18160 layout is set to 1&quot; x 2 5/8&quot; labels. Contact phone on labels uses <strong>{CONTACT_PHONE}</strong>.
            </p>
          </div>
          <div style={styles.actions}>
            <button style={styles.button} onClick={startCamera}>
              <Camera size={16} />
              Scan QR
            </button>
            <button style={styles.button} onClick={() => fileInputRef.current?.click()}>
              <Search size={16} />
              Scan from Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => scanImageFile(e.target.files?.[0])}
            />
            <select style={{ ...styles.select, width: 150 }} value={bulkType} onChange={(e) => setBulkType(e.target.value)}>
              <option value="All">All Labels</option>
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button style={styles.button} onClick={printBulkLabels}>
              <Printer size={16} />
              Bulk Labels
            </button>
            <button style={styles.button} onClick={exportCSV}>
              <Database size={16} /> Export CSV
            </button>
            <button style={styles.buttonPrimary} onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add Item
            </button>
          </div>
        </div>

        <div style={styles.statGrid}>
          <StatCard
            label="Total Assets"
            value={stats.total}
            icon={<Package size={16} />}
            onClick={() => setSelectedTypeFilter("All")}
            isActive={selectedTypeFilter === "All"}
          />
          <StatCard
            label="Scales"
            value={stats.scales}
            color={TYPE_COLORS.Scale}
            onClick={() => toggleTypeFilter("Scale")}
            isActive={selectedTypeFilter === "Scale"}
          />
          <StatCard
            label="Printers"
            value={stats.printers}
            color={TYPE_COLORS.Printer}
            onClick={() => toggleTypeFilter("Printer")}
            isActive={selectedTypeFilter === "Printer"}
          />
          <StatCard
            label="Phones"
            value={stats.phones}
            color={TYPE_COLORS.Phone}
            onClick={() => toggleTypeFilter("Phone")}
            isActive={selectedTypeFilter === "Phone"}
          />
        </div>

        <div style={{ ...styles.card, ...styles.cardPad }}>
          <div style={styles.inputWrap}>
            <Search size={16} style={{ position: "absolute", left: 14, top: 13, color: "#94a3b8" }} />
            <input
              style={{ ...styles.input, ...styles.iconInput }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, serial number, model, bluetooth name, location, status, or assignee"
            />
          </div>
        </div>

        {selectedTypeFilter !== "All" && (
          <div style={{ color: "#475569", fontSize: 14, fontWeight: 700 }}>
            Filtering by: <span style={{ color: TYPE_COLORS[selectedTypeFilter] }}>{selectedTypeFilter}</span>
          </div>
        )}

        <div style={{ ...styles.row, alignItems: "center" }}>
          <div style={styles.tabs}>
            <button style={{ ...styles.tab, ...(activeTab === "cards" ? styles.tabActive : {}) }} onClick={() => setActiveTab("cards")}>
              Field View
            </button>
            <button style={{ ...styles.tab, ...(activeTab === "admin" ? styles.tabActive : {}) }} onClick={() => setActiveTab("admin")}>
              Admin View
            </button>
          </div>

          {activeTab === "cards" && (
            <div style={styles.tabs}>
              <button style={{ ...styles.tab, ...(fieldViewMode === "cards" ? styles.tabActive : {}) }} onClick={() => setFieldViewMode("cards")}>
                Card View
              </button>
              <button style={{ ...styles.tab, ...(fieldViewMode === "board" ? styles.tabActive : {}) }} onClick={() => setFieldViewMode("board")}>
                Board View
              </button>
            </div>
          )}
        </div>

        {activeTab === "cards" ? (
          fieldViewMode === "cards" ? (
          <div style={styles.itemGrid}>
            {filteredItems.map((item) => (
              <div key={item.id} style={{ ...styles.card, ...styles.cardPad }}>
                <div style={styles.itemCard}>
                  <div style={styles.itemMeta}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800 }}>{item.id}</span>
                      <span style={{ ...styles.badge, color: TYPE_COLORS[item.type], borderColor: TYPE_COLORS[item.type] }}>{item.type}</span>
                    </div>
                    <div style={{ color: "#475569", fontSize: 14 }}>Location: {item.location || "—"}</div>
                    <div style={{ color: "#475569", fontSize: 14 }}>Status: {item.status || "—"}</div>
                    <div style={{ color: "#475569", fontSize: 14 }}>Assigned To: {item.assignedTo || "—"}</div>
                    <div style={{ color: "#475569", fontSize: 14 }}>Notes: {item.notes || "—"}</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>
                      Updated: {item.lastUpdated ? new Date(item.lastUpdated).toLocaleString() : "—"}
                    </div>
                  </div>

                  <div style={styles.qrBox}>
                    <QRCodeSVG id={`qr-${item.id}`} value={item.id} size={92} />
                    <button style={styles.button} onClick={() => openItemEditor(item.id)}>
                      Update Item
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
            <BoardView items={filteredItems} onOpenItem={openItemEditor} />
          )
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
                    <th style={styles.th}>Bluetooth Name</th>
                    <th style={styles.th}>QR</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ ...styles.td, minWidth: 120, whiteSpace: "nowrap" }}>
                        <strong>{item.id}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: TYPE_COLORS[item.type], fontWeight: 700 }}>{item.type}</span>
                      </td>
                      <td style={styles.td}>
                        <input
                          style={styles.input}
                          defaultValue={item.manufacturerSN || ""}
                          onBlur={(e) => handleAdminTextCommit(item.id, "manufacturerSN", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          style={styles.input}
                          defaultValue={item.model || ""}
                          onBlur={(e) => handleAdminTextCommit(item.id, "model", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                        />
                      </td>
                      <td style={styles.td}>
                        <select
                          style={styles.select}
                          value={item.location || "Warehouse"}
                          onChange={(e) => updateItemField(item.id, "location", e.target.value)}
                        >
                          {LOCATIONS.map((location) => (
                            <option key={location} value={location}>
                              {location}
                            </option>
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
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={styles.td}>
                        <input
                          style={styles.input}
                          defaultValue={item.assignedTo || ""}
                          onBlur={(e) => handleAdminTextCommit(item.id, "assignedTo", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          style={styles.input}
                          defaultValue={item.bluetoothName || ""}
                          onBlur={(e) => handleAdminTextCommit(item.id, "bluetoothName", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                        />
                      </td>
                      <td style={styles.td}>
                        <QRCodeSVG value={item.id} size={50} />
                      </td>
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
                  <option key={type} value={type}>
                    {type}
                  </option>
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
                onChange={(e) => setForm({ ...form, manufacturerSN: e.target.value.toUpperCase() })}
              />
            </LabeledInput>

            <LabeledInput label="Model">
              <input
                style={styles.input}
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value.toUpperCase() })}
              />
            </LabeledInput>

            <LabeledInput label="Bluetooth Name">
              <input
                style={styles.input}
                value={form.bluetoothName}
                onChange={(e) => setForm({ ...form, bluetoothName: e.target.value.toUpperCase() })}
              />
            </LabeledInput>

            <LabeledInput label="Location">
              <select style={styles.select} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                {LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </LabeledInput>

            <LabeledInput label="Status">
              <select style={styles.select} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
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

            <LabeledInput label="Notes">
              <textarea
                style={{ ...styles.input, minHeight: 96, resize: "vertical" }}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
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

        <Modal open={selectedItem !== null} onClose={closeItemEditor} title={selectedItem ? `Update ${selectedItem.id}` : "Update Item"}>
          {selectedItem && draftItem && (
            <>
              <div style={styles.formGrid}>
                <LabeledInput label="Item ID">
                  <input style={styles.input} value={selectedItem.id} readOnly />
                </LabeledInput>

                <LabeledInput label="Type">
                  <input style={styles.input} value={selectedItem.type} readOnly />
                </LabeledInput>

                <LabeledInput label="Status">
                  <select
                    style={styles.select}
                    value={draftItem.status || "Available"}
                    onChange={(e) => updateItemField(selectedItem.id, "status", e.target.value)}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </LabeledInput>

                <LabeledInput label="Location">
                  <select
                    style={styles.select}
                    value={draftItem.location || "Warehouse"}
                    onChange={(e) => updateItemField(selectedItem.id, "location", e.target.value)}
                  >
                    {LOCATIONS.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </LabeledInput>

                <LabeledInput label="Assigned To">
                  <input
                    style={styles.input}
                    value={draftItem.assignedTo || ""}
                    onChange={(e) => updateItemField(selectedItem.id, "assignedTo", e.target.value)}
                    placeholder="Who has this item?"
                  />
                </LabeledInput>

                <LabeledInput label="Notes">
                  <textarea
                    style={{ ...styles.input, minHeight: 96, resize: "vertical" }}
                    value={draftItem.notes || ""}
                    onChange={(e) => updateItemField(selectedItem.id, "notes", e.target.value)}
                    placeholder="Add a quick note, condition update, sale detail, or handoff comment"
                  />
                </LabeledInput>
              </div>

              <div style={{ ...styles.card, ...styles.cardPad, marginTop: 18, background: "#f8fafc" }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>Quick Summary</div>
                <div style={{ display: "grid", gap: 8, fontSize: 14, color: "#475569" }}>
                  <div><strong>Status:</strong> {draftItem.status || "—"}</div>
                  <div><strong>Location:</strong> {draftItem.location || "—"}</div>
                  <div><strong>Assigned To:</strong> {draftItem.assignedTo || "—"}</div>
                  <div><strong>Notes:</strong> {draftItem.notes || "—"}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                <button style={styles.button} onClick={closeItemEditor}>
                  Cancel
                </button>
                <button style={styles.buttonPrimary} onClick={requestSaveItemUpdates}>
                  Save Changes
                </button>
              </div>

              <div style={styles.timelineWrap}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>Movement History</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                      Latest changes first for quick traceability.
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>
                    {selectedItem.history?.length || 0} event{selectedItem.history?.length === 1 ? "" : "s"}
                  </div>
                </div>
                <HistoryTimeline history={selectedItem.history || []} />
              </div>
            </>
          )}
        </Modal>

        <Modal open={showScannerModal} onClose={stopCamera} title="Scan QR">
          <div style={{ display: "grid", gap: 14 }}>
            <video ref={videoRef} style={{ width: "100%", borderRadius: 18, background: "black" }} autoPlay playsInline muted />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <input style={styles.input} value={scanResult} readOnly placeholder="Scan result will appear here" />
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Live camera scanning can still be picky on iPhone. Use <strong>Scan from Photo</strong> for a more reliable fallback.
            </div>
          </div>
        </Modal>

        <Modal open={pendingChange !== null} onClose={cancelPendingChange} title="Confirm Update">
          {pendingChange && (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
                Please review these changes before saving them.
              </div>

              <div style={{ ...styles.card, ...styles.cardPad, background: "#f8fafc" }}>
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Item</span>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{pendingChange.id}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Summary</span>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{pendingChange.changes.length} change{pendingChange.changes.length === 1 ? "" : "s"} ready to save</div>
                  </div>
                </div>
              </div>

              <PendingChangesSummary changes={pendingChange.changes} />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                <button style={styles.button} onClick={cancelPendingChange}>
                  Back
                </button>
                <button style={styles.buttonPrimary} onClick={confirmPendingChange}>
                  Confirm
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

console.assert(normalizeUppercaseFields("model", "abc-123") === "ABC-123", "model should normalize to uppercase");
console.assert(normalizeUppercaseFields("assignedTo", "lucia") === "lucia", "assignedTo should remain unchanged");
console.assert(
  generateNextId("Scale", [{ type: "Scale", id: "SC-001" }, { type: "Scale", id: "SC-009" }]) === "SC-010",
  "generateNextId should increment the largest existing scale ID"
);
