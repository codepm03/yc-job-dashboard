"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OutreachNote {
  id: number;
  company_name: string;
  founder_name: string;
  note: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export default function OutreachPage() {
  const [notes, setNotes] = useState<OutreachNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    company_id: "",
    founder_id: "",
    note: "",
    status: "not_sent",
  });

  const fetchNotes = () => {
    setLoading(true);
    fetch("/api/outreach")
      .then((r) => r.json())
      .then((data) => setNotes(data.notes || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_id: form.company_id ? Number(form.company_id) : null,
        founder_id: form.founder_id ? Number(form.founder_id) : null,
        note: form.note,
        status: form.status,
      }),
    });
    setForm({ company_id: "", founder_id: "", note: "", status: "not_sent" });
    setShowForm(false);
    fetchNotes();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/outreach/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchNotes();
  };

  const deleteNote = async (id: number) => {
    await fetch(`/api/outreach/${id}`, { method: "DELETE" });
    fetchNotes();
  };

  const statusColors: Record<string, string> = {
    not_sent: "bg-gray-100 text-gray-600",
    sent: "bg-blue-100 text-blue-700",
    responded: "bg-green-100 text-green-700",
    closed: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            YC Job Dashboard
          </Link>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/jobs" className="text-gray-600 hover:text-gray-900">
              Jobs
            </Link>
            <Link
              href="/companies"
              className="text-gray-600 hover:text-gray-900"
            >
              Companies
            </Link>
            <Link
              href="/outreach"
              className="text-orange-600 font-medium"
            >
              Outreach
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Outreach Tracker</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
          >
            {showForm ? "Cancel" : "+ Add Note"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg border border-gray-200 p-6 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company ID (optional)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={form.company_id}
                  onChange={(e) =>
                    setForm({ ...form, company_id: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Founder ID (optional)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={form.founder_id}
                  onChange={(e) =>
                    setForm({ ...form, founder_id: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Write your outreach note..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
              >
                Save Note
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No outreach notes yet. Click "Add Note" to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((n) => (
              <div
                key={n.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {n.company_name && (
                      <span className="font-medium text-sm">
                        {n.company_name}
                      </span>
                    )}
                    {n.founder_name && (
                      <span className="text-sm text-gray-500 ml-2">
                        / {n.founder_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={n.status}
                      onChange={(e) => updateStatus(n.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border-0 ${
                        statusColors[n.status] || statusColors.not_sent
                      }`}
                    >
                      <option value="not_sent">Not Sent</option>
                      <option value="sent">Sent</option>
                      <option value="responded">Responded</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{n.note}</p>
                <div className="text-xs text-gray-400 mt-2">
                  Created: {new Date(n.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
