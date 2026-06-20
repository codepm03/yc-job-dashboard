"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { useState } from "react";

export default function OutreachPage() {
  const notes = useQuery(api.outreach.list, {});
  const createNote = useMutation(api.outreach.create);
  const updateNote = useMutation(api.outreach.update);
  const deleteNote = useMutation(api.outreach.remove);

  const [showForm, setShowForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [founderName, setFounderName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await createNote({
      note: noteText,
      founderName: founderName || undefined,
      status: "not_sent",
    });
    setNoteText("");
    setFounderName("");
    setShowForm(false);
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Founder / Contact Name (optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                placeholder="e.g., John Smith"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write your outreach note..."
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
            >
              Save Note
            </button>
          </form>
        )}

        {!notes ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No outreach notes yet. Click "Add Note" to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((n) => (
              <div
                key={n._id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {n.companyName && (
                      <span className="font-medium text-sm">
                        {n.companyName}
                      </span>
                    )}
                    {n.founderName && (
                      <span className="text-sm text-gray-500 ml-2">
                        / {n.founderName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={n.status || "not_sent"}
                      onChange={(e) =>
                        updateNote({ id: n._id, status: e.target.value })
                      }
                      className={`text-xs px-2 py-1 rounded border-0 ${
                        statusColors[n.status || "not_sent"]
                      }`}
                    >
                      <option value="not_sent">Not Sent</option>
                      <option value="sent">Sent</option>
                      <option value="responded">Responded</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      onClick={() => deleteNote({ id: n._id })}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{n.note}</p>
                {n.sentAt && (
                  <div className="text-xs text-gray-400 mt-2">
                    Sent: {new Date(n.sentAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
