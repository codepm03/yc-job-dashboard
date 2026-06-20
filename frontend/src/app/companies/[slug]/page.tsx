"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CompanyPage() {
  const params = useParams();
  const slug = params.slug as string;
  const company = useQuery(api.companies.get, { slug });

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
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
            {company.topCompany && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
                Top Company
              </span>
            )}
            {company.isHiring && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                Hiring
              </span>
            )}
          </div>
          <p className="text-gray-600">{company.oneLiner}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <InfoCard label="Batch" value={company.batch || "-"} />
          <InfoCard label="Industry" value={company.industry || "-"} />
          <InfoCard
            label="Team Size"
            value={company.teamSize ? String(company.teamSize) : "-"}
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
          {company.ycUrl && (
            <a
              href={company.ycUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              YC Profile
            </a>
          )}
        </div>

        {company.longDescription && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="font-semibold mb-3">About</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {company.longDescription}
            </p>
          </div>
        )}

        {company.founders && company.founders.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="font-semibold mb-4">Founders</h2>
            <div className="space-y-3">
              {company.founders.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{f.fullName}</div>
                    {f.title && (
                      <div className="text-sm text-gray-500">{f.title}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {f.linkedinUrl && (
                      <a
                        href={f.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        LinkedIn
                      </a>
                    )}
                    {f.twitterUrl && (
                      <a
                        href={f.twitterUrl}
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

        {company.tags && company.tags.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="font-semibold mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {company.tags.map((tag, i) => (
                <span
                  key={i}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
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
