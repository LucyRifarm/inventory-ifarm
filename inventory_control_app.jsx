import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Printer, Camera, Search, Database, Package, Boxes } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const TYPES = ["Scale", "Printer", "Phone"];
const TYPE_PREFIX = { Scale: "SC", Printer: "PR", Phone: "PH" };
const LOCATIONS = ["Warehouse", "Office", "Transit", "Customer Site"];
const STATUSES = ["Available", "Reserved", "In Transit", "In Use", "In Repair", "Missing"];
const STORAGE_KEY = "inventory-control-items-v5";
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

export default function InventoryControlApp() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [open, setOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [search, setSearch] = useState("");
  const videoRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      item.id.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      (item.manufacturerSN || "").toLowerCase().includes(q) ||
      (item.model || "").toLowerCase().includes(q) ||
      (item.location || "").toLowerCase().includes(q) ||
      (item.status || "").toLowerCase().includes(q) ||
      (item.assignedTo || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      scales: items.filter((i) => i.type === "Scale").length,
      printers: items.filter((i) => i.type === "Printer").length,
      phones: items.filter((i) => i.type === "Phone").length,
    };
  }, [items]);

  function generateNextId(type) {
    const prefix = TYPE_PREFIX[type];
    const numbers = items
      .filter((i) => i.type === type)
      .map((i) => parseInt(i.id.split("-")[1] || "0"));
    const next = (Math.max(0, ...numbers) + 1).toString().padStart(3, "0");
    return `${prefix}-${next}`;
  }

  function handleAddItem() {
    const id = form.id || generateNextId(form.type);
    setItems((prev) => [
      {
        ...form,
        id,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  function updateItemField(id, field, value) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function deleteItem(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function startCamera() {
    setScannerOpen(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }

    if ("BarcodeDetector" in window) {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      const scanLoop = async () => {
        if (!videoRef.current) return;
        const results = await detector.detect(videoRef.current);
        if (results.length > 0) {
          const code = results[0].rawValue;
          setScanResult(code);
          setSearch(code);
          setScannerOpen(false);
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        requestAnimationFrame(scanLoop);
      };
      scanLoop();
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannerOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{COMPANY_NAME} Inventory</h1>
            <p className="text-sm text-slate-600">Operations view + admin table for all asset data.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={startCamera} className="rounded-2xl">
              <Camera className="mr-2 h-4 w-4" />
              Scan QR
            </Button>
            <Button onClick={() => setOpen(true)} className="rounded-2xl">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-600"><Boxes className="h-4 w-4" /> Total Assets</CardTitle>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Scales</CardTitle>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold" style={{ color: TYPE_COLORS.Scale }}>{stats.scales}</div></CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Printers</CardTitle>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold" style={{ color: TYPE_COLORS.Printer }}>{stats.printers}</div></CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Phones</CardTitle>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold" style={{ color: TYPE_COLORS.Phone }}>{stats.phones}</div></CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, serial number, model, location, status, or assignee"
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl">
            <TabsTrigger value="cards" className="rounded-2xl">Field View</TabsTrigger>
            <TabsTrigger value="admin" className="rounded-2xl">Admin View</TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="rounded-2xl">
                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{item.id}</span>
                      <span className="text-sm font-medium" style={{ color: TYPE_COLORS[item.type] }}>{item.type}</span>
                    </div>
                    <div className="text-sm text-slate-600">SN: {item.manufacturerSN || "—"}</div>
                    <div className="text-sm text-slate-600">Model: {item.model || "—"}</div>
                    <div className="text-sm text-slate-600">Location: {item.location || "—"}</div>
                    <div className="text-sm text-slate-600">Status: {item.status || "—"}</div>
                    <div className="text-sm text-slate-600">Assigned To: {item.assignedTo || "—"}</div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <QRCodeSVG value={item.id} size={90} />
                    <Button variant="outline" className="rounded-2xl">
                      <Printer className="mr-2 h-4 w-4" />
                      Label
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="admin">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Database className="h-4 w-4" /> Full Asset Data</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="py-3 pr-4">ID</th>
                      <th className="py-3 pr-4">Type</th>
                      <th className="py-3 pr-4">Manufacturer SN</th>
                      <th className="py-3 pr-4">Model</th>
                      <th className="py-3 pr-4">Location</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Assigned To</th>
                      <th className="py-3 pr-4">QR</th>
                      <th className="py-3 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-b align-top">
                        <td className="py-3 pr-4 font-medium">{item.id}</td>
                        <td className="py-3 pr-4">
                          <span style={{ color: TYPE_COLORS[item.type], fontWeight: 600 }}>{item.type}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <Input
                            value={item.manufacturerSN || ""}
                            onChange={(e) => updateItemField(item.id, "manufacturerSN", e.target.value)}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <Input
                            value={item.model || ""}
                            onChange={(e) => updateItemField(item.id, "model", e.target.value)}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <Select value={item.location || "Warehouse"} onValueChange={(value) => updateItemField(item.id, "location", value)}>
                            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {LOCATIONS.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 pr-4">
                          <Select value={item.status || "Available"} onValueChange={(value) => updateItemField(item.id, "status", value)}>
                            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-3 pr-4">
                          <Input
                            value={item.assignedTo || ""}
                            onChange={(e) => updateItemField(item.id, "assignedTo", e.target.value)}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <QRCodeSVG value={item.id} size={50} />
                        </td>
                        <td className="py-3 pr-4">
                          <Button variant="outline" size="sm" onClick={() => deleteItem(item.id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredItems.length === 0 && (
                  <div className="py-10 text-center text-sm text-slate-500">No data found.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="rounded-2xl max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Item</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Internal ID</Label>
                <Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="Leave blank for auto-ID" />
              </div>

              <div className="space-y-2">
                <Label>Manufacturer SN</Label>
                <Input value={form.manufacturerSN} onChange={(e) => setForm({ ...form, manufacturerSN: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Assigned To</Label>
                <Input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleAddItem} className="rounded-2xl">
                <Package className="mr-2 h-4 w-4" />
                Save Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={scannerOpen} onOpenChange={(value) => !value && stopCamera()}>
          <DialogContent className="rounded-2xl max-w-xl">
            <DialogHeader>
              <DialogTitle>Scan QR</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <video ref={videoRef} className="w-full rounded-xl bg-black" />
              <Input value={scanResult} readOnly placeholder="Scan result will appear here" />
              <div className="flex justify-end">
                <Button variant="outline" onClick={stopCamera}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
