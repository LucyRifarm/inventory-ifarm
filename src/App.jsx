// FORCE NEW BUILD - VERSION 2
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
const STATUSES = ["Available", "Reserved", "In Transit", "In Use", "In Repair", "Missing"];
const STORAGE_KEY = "inventory-control-items-v6";
const COMPANY_NAME = "i-Farm Inc";
const LOGO_URL = "/ifarm-logo.png";
const CONTACT_PHONE = "(509) 537-6076"; // replace with your real support/contact number
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
    minWidth: 1080,
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
  const [bulkType, setBulkType] = useState("All");
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
        item.bluetoothName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [items, search]);

  const stats = useMemo(
    () => ({
      total: items.length,
      scales: items.filter((i) => i.type === "Scale").length,
      printers: items.filter((i) => i.type === "Printer").length,
      phones: items.filter((i) => i.type === "Phone").length,
    }),
    [items]
  );

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
          // native detector unavailable or failed; continue to jsQR fallback
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
      setScanResult("Camera access failed. Please check browser permissions.");
      console.error(error);
    }
  }

  function handleDecodedValue(rawValue) {
    if (!rawValue) return;
    const value = String(rawValue).trim();
    setScanResult(value);
    setSearch(value);
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

      setScanResult("Could not read this QR yet. Try a brighter photo or move a little farther back.");
    } catch (error) {
      setScanResult("Image scan failed. Please try again.");
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

  function printLabel(item) {
    const w = window.open("", "_blank", "width=700,height=420");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>${item.id} Label</title>
          <style>${getPrintStyles()}</style>
        </head>
        <body>
          <div class="sheetPage">
            <div class="labelWrap">${getLabelMarkup(item)}</div>
          </div>
          <script>window.onload = () => window.print();<\/script>
        </body>
      </html>
    `);
    w.document.close();
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
              placeholder="Search by ID, serial number, model, bluetooth name, location, status, or assignee"
            />
          </div>
        </div>

        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(activeTab === "cards" ? styles.tabActive : {}) }} onClick={() => setActiveTab("cards")}>
            Field View
          </button>
          <button style={{ ...styles.tab, ...(activeTab === "admin" ? styles.tabActive : {}) }} onClick={() => setActiveTab("admin")}>
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
                    <div style={{ color: "#475569", fontSize: 14 }}>Bluetooth: {item.bluetoothName || "—"}</div>
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
                    <th style={styles.th}>Bluetooth Name</th>
                    <th style={styles.th}>QR</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td style={styles.td}>
                        <strong>{item.id}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: TYPE_COLORS[item.type], fontWeight: 700 }}>{item.type}</span>
                      </td>
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
                          value={item.assignedTo || ""}
                          onChange={(e) => updateItemField(item.id, "assignedTo", e.target.value)}
                        />
                      </td>
                      <td style={styles.td}>
                        <input
                          style={styles.input}
                          value={item.bluetoothName || ""}
                          onChange={(e) => updateItemField(item.id, "bluetoothName", e.target.value)}
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
                onChange={(e) => setForm({ ...form, manufacturerSN: e.target.value })}
              />
            </LabeledInput>

            <LabeledInput label="Model">
              <input style={styles.input} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </LabeledInput>

            <LabeledInput label="Bluetooth Name">
              <input
                style={styles.input}
                value={form.bluetoothName}
                onChange={(e) => setForm({ ...form, bluetoothName: e.target.value })}
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
            <video ref={videoRef} style={{ width: "100%", borderRadius: 18, background: "black" }} autoPlay playsInline muted />
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <input style={styles.input} value={scanResult} readOnly placeholder="Scan result will appear here" />
            <div style={{ fontSize: 13, color: "#64748b" }}>
              Live camera scanning can still be picky on iPhone. Use <strong>Scan from Photo</strong> for a more reliable fallback.
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
