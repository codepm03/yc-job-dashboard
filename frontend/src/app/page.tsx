"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  total_companies: number;
  hiring_companies: number;
  total_jobs: number;
  total_founders: number;
  jobs_by_tier: Record<string, number>;
  companies_by_batch: Record<string, number>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            YC Job Dashboard
          </h1>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-orange-600 font-medium">
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
              className="text-gray-600 hover:text-gray-900"
            >
              Outreach
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Companies"
            value={stats?.total_companies ?? 0}
            color="bg-blue-500"
          />
          <StatCard
            label="Hiring Now"
            value={stats?.hiring_companies ?? 0}
            color="bg-green-500"
          />
          <StatCard
            label="Total Jobs"
            value={stats?.total_jobs ?? 0}
            color="bg-purple-500"
          />
          <StatCard
            label="Founders"
            value={stats?.total_founders ?? 0}
            color="bg-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Jobs by Tier</h3>
            <div className="space-y-3">
              {["T1", "T2", "T3"].map((tier) => (
                <div key={tier} className="flex items-center gap-3">
                  <TierBadge tier={tier} />
                  <div className="flex-1 bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        tier === "T1"
                          ? "bg-green-500"
                          : tier === "T2"
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                      style={{
                        width: `${
                          stats?.total_jobs
                            ? ((stats.jobs_by_tier?.[tier] ?? 0) /
                                stats.total_jobs) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {stats?.jobs_by_tier?.[tier] ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">Top YC Batches</h3>
            <div className="space-y-2">
              {Object.entries(stats?.companies_by_batch ?? {})
                .slice(0, 8)
                .map(([batch, count]) => (
                  <div key={batch} className="flex justify-between text-sm">
                    <span className="text-gray-700">{batch}</span>
                    <span className="font-medium">{count} companies</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="flex gap-4">
            <Link
              href="/jobs"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
            >
              Browse Jobs
            </Link>
            <Link
              href="/companies"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              View Companies
            </Link>
            <Link
              href="/outreach"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Outreach Tracker
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-3xl font-bold mt-2">{value.toLocaleString()}</div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    T1: "bg-green-100 text-green-800",
    T2: "bg-yellow-100 text-yellow-800",
    T3: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[tier]}`}
    >
      {tier}
    </span>
  );
}
