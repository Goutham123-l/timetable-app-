import React, { useEffect, useState } from "react";
import { api, downloadFile } from "../api";

export default function Assignments() {
  const [items, setItems] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [form, setForm] = useState({ teacherId: "", subjectId: "", sectionId: "", periodsPerWeek: 3 });
  const [error, setError] = useState("");

  const load = () => api.get("/assignments").then(setItems);

  useEffect(() => {
    load();
    api.get("/teachers").then(setTeachers);
    api.get("/subjects").then(setSubjects);
    api.get("/sections").then(setSections);
  }, []);

  async function add() {
    setError("");
    if (!form.teacherId || !form.subjectId || !form.sectionId) {
      setError("Select teacher, subject and section.");
      return;
    }
    try {
      await api.post("/assignments", form);
      setForm({ teacherId: "", subjectId: "", sectionId: "", periodsPerWeek: 3 });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function remove(id: number) {
    if (!confirm("Remove this assignment?")) return;
    await api.delete(`/assignments/${id}`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Teacher–Subject–Section Assignment Table</h2>
        <button
          onClick={() => downloadFile("/export/excel/assignments", "assignments.xlsx")}
          className="bg-slate-800 text-white text-sm px-4 py-2 rounded-lg"
        >
          Export to Excel
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        This is your manual sheet — fill in which teacher teaches which subject to which section, and how many periods per week it needs. The generator uses exactly this table.
      </p>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6">
        {error && <div className="bg-red-50 text-red-600 text-sm p-2 rounded mb-3">{error}</div>}
        <div className="flex gap-2 flex-wrap items-center">
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
            <option value="">Teacher</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} {s.type === "LAB" ? "(Lab)" : ""}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}>
            <option value="">Section</option>
            {sections.map((s) => <option key={s.id} value={s.id}>{s.department?.code} {s.name} (Yr {s.year})</option>)}
          </select>
          <input
            className="border rounded-lg px-3 py-2 text-sm w-32"
            type="number"
            min={1}
            placeholder="Periods/week"
            value={form.periodsPerWeek}
            onChange={(e) => setForm({ ...form, periodsPerWeek: Number(e.target.value) })}
          />
          <button onClick={add} className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm">Add Row</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Teacher</th>
              <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Subject</th>
              <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Section</th>
              <th className="text-left p-3 text-xs font-semibold text-slate-500 uppercase">Periods/Week</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="p-3 text-sm">{a.teacher?.name}</td>
                <td className="p-3 text-sm">{a.subject?.name} {a.subject?.type === "LAB" && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded ml-1">LAB</span>}</td>
                <td className="p-3 text-sm">{a.section?.department?.code} {a.section?.name} (Yr {a.section?.year})</td>
                <td className="p-3 text-sm">{a.periodsPerWeek}</td>
                <td className="p-3 text-sm"><button onClick={() => remove(a.id)} className="text-red-500 text-xs">Delete</button></td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-400 text-sm">No assignments yet. Add your first row above.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
