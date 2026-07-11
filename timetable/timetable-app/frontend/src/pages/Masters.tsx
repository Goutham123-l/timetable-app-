import React, { useEffect, useState } from "react";
import { api } from "../api";

type Tab = "departments" | "sections" | "subjects" | "teachers" | "classrooms" | "days" | "periods";

export default function Masters() {
  const [tab, setTab] = useState<Tab>("departments");

  const tabs: { key: Tab; label: string }[] = [
    { key: "departments", label: "Departments" },
    { key: "sections", label: "Sections" },
    { key: "subjects", label: "Subjects" },
    { key: "teachers", label: "Teachers" },
    { key: "classrooms", label: "Classrooms" },
    { key: "days", label: "Working Days" },
    { key: "periods", label: "Periods" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Master Data</h2>
      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              tab === t.key ? "bg-brand-500 text-white" : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "departments" && <Departments />}
      {tab === "sections" && <Sections />}
      {tab === "subjects" && <Subjects />}
      {tab === "teachers" && <Teachers />}
      {tab === "classrooms" && <Classrooms />}
      {tab === "days" && <WorkingDays />}
      {tab === "periods" && <Periods />}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">{children}</div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left p-2 text-xs font-semibold text-slate-500 uppercase">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="p-2 border-t border-slate-100 text-sm">{children}</td>;
}

// ---------------- Departments ----------------
function Departments() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const load = () => api.get("/departments").then(setItems);
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!name || !code) return;
    await api.post("/departments", { name, code });
    setName("");
    setCode("");
    load();
  }
  async function remove(id: number) {
    if (!confirm("Delete this department?")) return;
    await api.delete(`/departments/${id}`).catch((e) => alert(e.message));
    load();
  }

  return (
    <Card>
      <div className="flex gap-2 mb-4">
        <input className="border rounded-lg px-3 py-2 text-sm flex-1" placeholder="Department name (e.g. Computer Science)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 text-sm w-32" placeholder="Code (CSE)" value={code} onChange={(e) => setCode(e.target.value)} />
        <button onClick={add} className="bg-brand-500 text-white px-4 rounded-lg text-sm">Add</button>
      </div>
      <table className="w-full">
        <thead><tr><Th>Name</Th><Th>Code</Th><Th></Th></tr></thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id}>
              <Td>{d.name}</Td>
              <Td>{d.code}</Td>
              <Td><button onClick={() => remove(d.id)} className="text-red-500 text-xs">Delete</button></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------- Sections ----------------
function Sections() {
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [year, setYear] = useState(1);
  const [departmentId, setDepartmentId] = useState<number | "">("");

  const load = () => api.get("/sections").then(setItems);
  useEffect(() => {
    load();
    api.get("/departments").then(setDepartments);
  }, []);

  async function add() {
    if (!name || !departmentId) return;
    await api.post("/sections", { name, year, departmentId });
    setName("");
    load();
  }
  async function remove(id: number) {
    if (!confirm("Delete this section?")) return;
    await api.delete(`/sections/${id}`).catch((e) => alert(e.message));
    load();
  }

  return (
    <Card>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select className="border rounded-lg px-3 py-2 text-sm" value={departmentId} onChange={(e) => setDepartmentId(Number(e.target.value))}>
          <option value="">Department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
        </select>
        <input className="border rounded-lg px-3 py-2 text-sm w-24" placeholder="Section (A)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="border rounded-lg px-3 py-2 text-sm w-24" type="number" min={1} max={4} placeholder="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        <button onClick={add} className="bg-brand-500 text-white px-4 rounded-lg text-sm">Add</button>
      </div>
      <table className="w-full">
        <thead><tr><Th>Section</Th><Th>Year</Th><Th>Department</Th><Th></Th></tr></thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <Td>{s.name}</Td>
              <Td>{s.year}</Td>
              <Td>{s.department?.code}</Td>
              <Td><button onClick={() => remove(s.id)} className="text-red-500 text-xs">Delete</button></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------- Subjects ----------------
function Subjects() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", code: "", credits: 3, type: "THEORY", weeklyHours: 3 });

  const load = () => api.get("/subjects").then(setItems);
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!form.name || !form.code) return;
    await api.post("/subjects", form);
    setForm({ name: "", code: "", credits: 3, type: "THEORY", weeklyHours: 3 });
    load();
  }
  async function remove(id: number) {
    if (!confirm("Delete this subject?")) return;
    await api.delete(`/subjects/${id}`).catch((e) => alert(e.message));
    load();
  }

  return (
    <Card>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Subject name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm w-32" placeholder="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <select className="border rounded-lg px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="THEORY">Theory</option>
          <option value="LAB">Lab</option>
        </select>
        <input className="border rounded-lg px-3 py-2 text-sm w-28" type="number" placeholder="Weekly hrs" value={form.weeklyHours} onChange={(e) => setForm({ ...form, weeklyHours: Number(e.target.value) })} />
        <input className="border rounded-lg px-3 py-2 text-sm w-24" type="number" placeholder="Credits" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
        <button onClick={add} className="bg-brand-500 text-white px-4 rounded-lg text-sm">Add</button>
      </div>
      <table className="w-full">
        <thead><tr><Th>Name</Th><Th>Code</Th><Th>Type</Th><Th>Weekly Hrs</Th><Th>Credits</Th><Th></Th></tr></thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id}>
              <Td>{s.name}</Td>
              <Td>{s.code}</Td>
              <Td>{s.type}</Td>
              <Td>{s.weeklyHours}</Td>
              <Td>{s.credits}</Td>
              <Td><button onClick={() => remove(s.id)} className="text-red-500 text-xs">Delete</button></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------- Teachers ----------------
function Teachers() {
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", departmentId: "", designation: "", maxPeriodsDay: 6, maxPeriodsWeek: 24 });

  const load = () => api.get("/teachers").then(setItems);
  useEffect(() => {
    load();
    api.get("/departments").then(setDepartments);
  }, []);

  async function add() {
    if (!form.name || !form.departmentId) return;
    await api.post("/teachers", form);
    setForm({ name: "", departmentId: "", designation: "", maxPeriodsDay: 6, maxPeriodsWeek: 24 });
    load();
  }
  async function remove(id: number) {
    if (!confirm("Delete this teacher?")) return;
    await api.delete(`/teachers/${id}`).catch((e) => alert(e.message));
    load();
  }

  return (
    <Card>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Teacher name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="border rounded-lg px-3 py-2 text-sm" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
          <option value="">Department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
        </select>
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm w-28" type="number" placeholder="Max/day" value={form.maxPeriodsDay} onChange={(e) => setForm({ ...form, maxPeriodsDay: Number(e.target.value) })} />
        <input className="border rounded-lg px-3 py-2 text-sm w-28" type="number" placeholder="Max/week" value={form.maxPeriodsWeek} onChange={(e) => setForm({ ...form, maxPeriodsWeek: Number(e.target.value) })} />
        <button onClick={add} className="bg-brand-500 text-white px-4 rounded-lg text-sm">Add</button>
      </div>
      <table className="w-full">
        <thead><tr><Th>Name</Th><Th>Dept</Th><Th>Designation</Th><Th>Max/Day</Th><Th>Max/Week</Th><Th></Th></tr></thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id}>
              <Td>{t.name}</Td>
              <Td>{t.department?.code}</Td>
              <Td>{t.designation}</Td>
              <Td>{t.maxPeriodsDay}</Td>
              <Td>{t.maxPeriodsWeek}</Td>
              <Td><button onClick={() => remove(t.id)} className="text-red-500 text-xs">Delete</button></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------- Classrooms ----------------
function Classrooms() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ roomNumber: "", capacity: 60, type: "CLASSROOM" });

  const load = () => api.get("/classrooms").then(setItems);
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!form.roomNumber) return;
    await api.post("/classrooms", form);
    setForm({ roomNumber: "", capacity: 60, type: "CLASSROOM" });
    load();
  }
  async function remove(id: number) {
    if (!confirm("Delete this room?")) return;
    await api.delete(`/classrooms/${id}`).catch((e) => alert(e.message));
    load();
  }

  return (
    <Card>
      <div className="flex gap-2 mb-4 flex-wrap">
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Room number" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm w-28" type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
        <select className="border rounded-lg px-3 py-2 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="CLASSROOM">Classroom</option>
          <option value="LAB">Lab</option>
        </select>
        <button onClick={add} className="bg-brand-500 text-white px-4 rounded-lg text-sm">Add</button>
      </div>
      <table className="w-full">
        <thead><tr><Th>Room</Th><Th>Capacity</Th><Th>Type</Th><Th></Th></tr></thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <Td>{r.roomNumber}</Td>
              <Td>{r.capacity}</Td>
              <Td>{r.type}</Td>
              <Td><button onClick={() => remove(r.id)} className="text-red-500 text-xs">Delete</button></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------- Working Days ----------------
function WorkingDays() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", order: 1 });

  const load = () => api.get("/settings/days").then(setItems);
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!form.name) return;
    await api.post("/settings/days", { ...form, active: true });
    setForm({ name: "", order: items.length + 1 });
    load();
  }
  async function toggle(d: any) {
    await api.put(`/settings/days/${d.id}`, { name: d.name, order: d.order, active: !d.active });
    load();
  }
  async function remove(id: number) {
    await api.delete(`/settings/days/${id}`);
    load();
  }

  return (
    <Card>
      <div className="flex gap-2 mb-4">
        <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Day name (e.g. Sunday)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm w-24" type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
        <button onClick={add} className="bg-brand-500 text-white px-4 rounded-lg text-sm">Add</button>
      </div>
      <table className="w-full">
        <thead><tr><Th>Day</Th><Th>Order</Th><Th>Active</Th><Th></Th></tr></thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id}>
              <Td>{d.name}</Td>
              <Td>{d.order}</Td>
              <Td>
                <button onClick={() => toggle(d)} className={`text-xs px-2 py-1 rounded ${d.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {d.active ? "Active" : "Off"}
                </button>
              </Td>
              <Td><button onClick={() => remove(d.id)} className="text-red-500 text-xs">Delete</button></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ---------------- Periods ----------------
function Periods() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ index: 1, label: "", startTime: "", endTime: "", isLunch: false });

  const load = () => api.get("/settings/periods").then(setItems);
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!form.label) return;
    await api.post("/settings/periods", form);
    setForm({ index: items.length + 1, label: "", startTime: "", endTime: "", isLunch: false });
    load();
  }
  async function remove(id: number) {
    await api.delete(`/settings/periods/${id}`);
    load();
  }

  return (
    <Card>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <input className="border rounded-lg px-3 py-2 text-sm w-20" type="number" placeholder="Order" value={form.index} onChange={(e) => setForm({ ...form, index: Number(e.target.value) })} />
        <input className="border rounded-lg px-3 py-2 text-sm w-24" placeholder="Label (P1)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm w-28" placeholder="Start (08:50)" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm w-28" placeholder="End (09:40)" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        <label className="text-sm flex items-center gap-1">
          <input type="checkbox" checked={form.isLunch} onChange={(e) => setForm({ ...form, isLunch: e.target.checked })} /> Lunch
        </label>
        <button onClick={add} className="bg-brand-500 text-white px-4 rounded-lg text-sm">Add</button>
      </div>
      <table className="w-full">
        <thead><tr><Th>Order</Th><Th>Label</Th><Th>Start</Th><Th>End</Th><Th>Lunch</Th><Th></Th></tr></thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <Td>{p.index}</Td>
              <Td>{p.label}</Td>
              <Td>{p.startTime}</Td>
              <Td>{p.endTime}</Td>
              <Td>{p.isLunch ? "Yes" : ""}</Td>
              <Td><button onClick={() => remove(p.id)} className="text-red-500 text-xs">Delete</button></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
