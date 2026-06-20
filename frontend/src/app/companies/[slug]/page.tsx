"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Company {
  id: number;
  slug: string;
  name: string;
  one_liner: string;
  long_description: string;
  batch: string;
  industry: string;
  team_size: number;
  is_hiring: boolean;
  top_company: boolean;
  website: string;
  yc_url: string;
  status: string;
  founders: Founder[];
  jobs: Job[];
}

interface Founder {
  id: number;
  full_name: string;
  title: string;
  linkedin_url: string;
  twitter_url: string;
  email: string;
}

interface Job {
  id: number;
  title: string;
  location: string;
  remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  tier: string;
  source: string;
  source_url: string;
}

export default function CompanyPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetch(`/api/companies/${slug}`)
        .then((r) => r.json())
        .then(setCompany)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Company not found
      </div>
    );
  }

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

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{company.name}</h1>
            {company.top_company && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
                Top Company
              </span>
            )}
            {company.is_hiring && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                Hiring
              </span>
            )}
          </div>
          <p className="text-gray-600">{company.one_liner}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <InfoCard label="Batch" value={company.batch || "-"} />
          <InfoCard label="Industry" value={company.industry || "-"} />
          <InfoCard
            label="Team Size"
            value={company.team_size ? String(company.team_size) : "-"}
          />
          <InfoCard label="Status" value={company.status || "-"} />
        </div>

        <div className="flex gap-3 mb-8">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              Website
            </a>
          )}
          {company.yc_url && (
            <a
              href={company.yc_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              YC Profile
            </a>
          )}
        </div>

        {company.long_description && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="font-semibold mb-3">About</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {company.long_description}
            </p>
          </div>
        )}

        {company.founders && company.founders.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="font-semibold mb-4">Founders</h2>
            <div className="space-y-3">
              {company.founders.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{f.full_name}</div>
                    {f.title && (
                      <div className="text-sm text-gray-500">{f.title}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {f.linkedin_url && (
                      <a
                        href={f.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        LinkedIn
                      </a>
                    )}
                    {f.twitter_url && (
                      <a
                        href={f.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded"
                      >
                        X / Twitter
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {company.jobs && company.jobs.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">
              Open Positions ({company.jobs.length})
            </h2>
            <div className="space-y-2">
              {company.jobs.map((j) => (
                <div
                  key={j.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm">{j.title}</div>
                    <div className="text-xs text-gray-500">
                      {j.location || "No location"}
                      {j.remote && " (Remote)"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        j.tier === "T1"
                          ? "bg-green-100 text-green-800"
                          : j.tier === "T2"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {j.tier}
                    </span>
                    {j.source_url && (
                      <a
                        href={j.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-600 hover:underline"
                      >
                        Apply
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}
