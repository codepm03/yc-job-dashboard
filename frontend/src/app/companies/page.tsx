"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Company {
  id: number;
  slug: string;
  name: string;
  one_liner: string;
  batch: string;
  industry: string;
  team_size: number;
  is_hiring: boolean;
  top_company: boolean;
  website: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("");
  const [hiringOnly, setHiringOnly] = useState(false);

  const fetchCompanies = (offset = 0) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (batch) params.set("batch", batch);
    if (hiringOnly) params.set("is_hiring", "true");
    params.set("limit", "50");
    params.set("offset", String(offset));

    fetch(`/api/companies?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCompanies(data.companies || []);
        setTotal(data.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompanies(0);
    setPage(0);
  }, [search, batch, hiringOnly]);

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
              className="text-orange-600 font-medium"
            >
              Companies
            </Link>
            <Link
              href="/outreach"
              className="text-gray-600 hover:text-gray-900"
            >
              Outreach
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Companies</h2>
          <span className="text-sm text-gray-500">
            {total.toLocaleString()} total
          </span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search companies..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter by batch (e.g., S24, W23)..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hiringOnly}
                onChange={(e) => setHiringOnly(e.target.checked)}
                className="rounded"
              />
              Hiring only
            </label>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading companies...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/companies/${c.slug}`}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  {c.top_company && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                      Top
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {c.one_liner || "No description"}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {c.batch && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {c.batch}
                    </span>
                  )}
                  {c.industry && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {c.industry}
                    </span>
                  )}
                  {c.is_hiring && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Hiring
                    </span>
                  )}
                  {c.team_size > 0 && (
                    <span className="text-gray-400">
                      {c.team_size} employees
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {total > 50 && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => {
                const newPage = Math.max(0, page - 1);
                setPage(newPage);
                fetchCompanies(newPage * 50);
              }}
              disabled={page === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page + 1} of {Math.ceil(total / 50)}
            </span>
            <button
              onClick={() => {
                const newPage = page + 1;
                setPage(newPage);
                fetchCompanies(newPage * 50);
              }}
              disabled={(page + 1) * 50 >= total}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
