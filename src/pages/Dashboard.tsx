import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardService } from '@/services/dashboard.service';
import type { DashboardSummary } from '@/models/api';
import type { LoanApplication } from '@/models/loan';
import { Card, CardHeader, LoadingSpinner, EmptyState } from '@/components/common/Surfaces';
import Badge from '@/components/common/Badge';
import { formatCurrency, formatDate, titleCase } from '@/utils/formatters';
import { AppError } from '@/services/api';

const FALLBACK_SUMMARY: DashboardSummary = {
  totalCustomers: 0,
  totalApplications: 0,
  pendingApplications: 0,
  approvedLoans: 0,
  rejectedLoans: 0,
  totalLoanAmount: 0,
  applicationsByStatus: [],
  amountByLoanType: [],
  monthlyApplications: [],
};

function SummaryCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recent, setRecent] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, recentData] = await Promise.allSettled([
          DashboardService.getSummary(),
          DashboardService.getRecentApplications(5),
        ]);
        if (!active) return;

        setSummary(summaryData.status === 'fulfilled' ? summaryData.value : FALLBACK_SUMMARY);
        setRecent(recentData.status === 'fulfilled' ? recentData.value : []);

        if (summaryData.status === 'rejected' && recentData.status === 'rejected') {
          setError(
            summaryData.reason instanceof AppError
              ? summaryData.reason.message
              : 'Unable to load dashboard data right now.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;

  const data = summary ?? FALLBACK_SUMMARY;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">Here's what's happening with your loans today.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error} Dashboard endpoints may not be connected yet — figures below default to zero.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="Customers" value={String(data.totalCustomers)} accent="text-slate-900" />
        <SummaryCard label="Applications" value={String(data.totalApplications)} accent="text-slate-900" />
        <SummaryCard label="Pending" value={String(data.pendingApplications)} accent="text-amber-600" />
        <SummaryCard label="Approved" value={String(data.approvedLoans)} accent="text-emerald-600" />
        <SummaryCard label="Rejected" value={String(data.rejectedLoans)} accent="text-red-600" />
        <SummaryCard label="Total Loan Amount" value={formatCurrency(data.totalLoanAmount)} accent="text-navy-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Loan Applications"
            action={
              <Link to="/loans" className="text-sm font-medium text-navy-700 hover:underline">
                View all
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              title="No loan applications yet"
              description="New applications submitted by customers will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Loan Type</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {app.customer?.name ?? `Customer #${app.customerId}`}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{titleCase(app.loanType)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatCurrency(app.loanAmount)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(app.applicationDate)}</td>
                      <td className="px-5 py-3">
                        <Badge status={app.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link to={`/loans/${app.id}`} className="text-sm font-medium text-navy-700 hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Applications by Status" />
          <div className="flex flex-col gap-3 p-5">
            {data.applicationsByStatus.length === 0 ? (
              <p className="text-sm text-slate-500">No data available yet.</p>
            ) : (
              data.applicationsByStatus.map((s) => {
                const max = Math.max(...data.applicationsByStatus.map((x) => x.count), 1);
                return (
                  <div key={s.status}>
                    <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                      <span>{titleCase(s.status)}</span>
                      <span>{s.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-navy-600"
                        style={{ width: `${(s.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
