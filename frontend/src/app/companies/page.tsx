"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { useState } from "react";

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("");
  const [hiringOnly, setHiringOnly] = useState(false);

  const companies = useQuery(api.companies.list, {
    search: search || undefined,
    batch: batch || undefined,
    isHiring: hiringOnly || undefined,
    limit: 100,
  });

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
            {companies?.total?.toLocaleString() || 0} total
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

        {!companies ? (
          <div className="text-center py-12 text-gray-500">
            Loading companies...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.companies.map((c) => (
              <Link
                key={c._id}
                href={`/companies/${c.slug}`}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  {c.topCompany && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                      Top
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {c.oneLiner || "No description"}
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
                  {c.isHiring && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Hiring
                    </span>
                  )}
                  {c.teamSize && c.teamSize > 0 && (
                    <span className="text-gray-400">
                      {c.teamSize} employees
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
