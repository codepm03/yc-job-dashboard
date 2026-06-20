"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Job {
  id: number;
  title: string;
  company_name: string;
  company_slug: string;
  location: string;
  remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  tier: string;
  source: string;
  source_url: string;
  posted_at: string;
  batch: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    tier: "",
    remote: "",
    batch: "",
  });

  const fetchJobs = (offset = 0) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.tier) params.set("tier", filters.tier);
    if (filters.remote) params.set("remote", filters.remote);
    if (filters.batch) params.set("batch", filters.batch);
    params.set("limit", "50");
    params.set("offset", String(offset));

    fetch(`/api/jobs?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs(0);
    setPage(0);
  }, [filters]);

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return "-";
    const fmt = (n: number) =>
      n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return `up to ${fmt(max!)}`;
  };

  const tierColors: Record<string, string> = {
    T1: "bg-green-100 text-green-800",
    T2: "bg-yellow-100 text-yellow-800",
    T3: "bg-gray-100 text-gray-600",
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
            <Link href="/jobs" className="text-orange-600 font-medium">
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
              className="text-gray-600 hover:text-gray-900"
            >
              Outreach
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Jobs</h2>
          <span className="text-sm text-gray-500">
            {total.toLocaleString()} total
          </span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search jobs..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={filters.tier}
              onChange={(e) =>
                setFilters({ ...filters, tier: e.target.value })
              }
            >
              <option value="">All Tiers</option>
              <option value="T1">T1 - High Priority</option>
              <option value="T2">T2 - Medium</option>
              <option value="T3">T3 - Lower</option>
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={filters.remote}
              onChange={(e) =>
                setFilters({ ...filters, remote: e.target.value })
              }
            >
              <option value="">All Locations</option>
              <option value="true">Remote Only</option>
              <option value="false">On-site Only</option>
            </select>
            <input
              type="text"
              placeholder="Filter by batch..."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={filters.batch}
              onChange={(e) =>
                setFilters({ ...filters, batch: e.target.value })
              }
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No jobs found. Run the data ingestion first.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Salary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/companies/${job.company_slug}`}
                        className="text-sm font-medium text-orange-600 hover:underline"
                      >
                        {job.company_name || "Unknown"}
                      </Link>
                      {job.batch && (
                        <span className="ml-2 text-xs text-gray-400">
                          {job.batch}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {job.source_url ? (
                        <a
                          href={job.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-900 hover:underline"
                        >
                          {job.title}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-900">
                          {job.title}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {job.location || "-"}
                      </span>
                      {job.remote && (
                        <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          Remote
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatSalary(job.salary_min, job.salary_max)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          tierColors[job.tier] || tierColors.T3
                        }`}
                      >
                        {job.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {job.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => {
                  const newPage = Math.max(0, page - 1);
                  setPage(newPage);
                  fetchJobs(newPage * 50);
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
                  fetchJobs(newPage * 50);
                }}
                disabled={(page + 1) * 50 >= total}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
