import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bloodRequestRepository } from '../../services/bloodRequestRepository';
import type { BloodRequest } from '../../types/bloodRequest';
import {
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const AdminRefillRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectModalReq, setRejectModalReq] = useState<BloodRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Alternative internal blood reserves available');

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await bloodRequestRepository.getRequests();
      // Filter requests pending admin approval
      setRequests(all);
    } catch (e) {
      console.error('Error loading requests for admin', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async (req: BloodRequest) => {
    setActionInProgress(req.id);
    try {
      // Step 16: Admin Approval -> Status transitions to 'approved'
      await bloodRequestRepository.updateRequest(req.id, {
        status: 'approved',
      });
      await loadRequests();
      // Navigate to matching
      navigate(`/hospital/requests/${req.id}/matching`);
    } catch (e) {
      console.error('Failed to approve request', e);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectModalReq) return;
    setActionInProgress(rejectModalReq.id);
    try {
      await bloodRequestRepository.cancelRequest(
        rejectModalReq.id,
        rejectReason,
        'Network Medical Administrator'
      );
      setRejectModalReq(null);
      await loadRequests();
    } catch (e) {
      console.error('Failed to reject request', e);
    } finally {
      setActionInProgress(null);
    }
  };

  const pendingRequests = requests.filter(
    (r) => r.status === 'pending_approval' || r.status === 'draft'
  );
  const approvedRequests = requests.filter(
    (r) => r.status === 'approved' || r.status === 'matched' || r.status === 'reserved'
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-inter text-[#0F172A] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Administrative Command &bull; Step 16
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">&bull; Human-in-the-Loop Governance</span>
            </div>
            <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Refill Requisitions Review
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and authorize hospital predictive blood replenishments. No automated transfers without administrator consent.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/hospital/dashboard"
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-2xs font-semibold"
            >
              &larr; Return to Hospital Portal
            </Link>

            <button
              type="button"
              onClick={loadRequests}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs cursor-pointer"
              title="Refresh requisitions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Section 1: Pending Approvals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-poppins font-bold text-lg text-slate-900">
                Pending Authorizations
              </h2>
              <span className="text-xs font-mono font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                {pendingRequests.length} urgent
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Ordered by urgency and time to stockout
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-poppins font-semibold text-base text-slate-800">
                All Requisitions Processed
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hospital blood refill requests currently await administrative review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-poppins font-bold text-lg">
                        {req.bloodGroup}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {req.displayId}
                          </span>
                          <span
                            className={`text-[10px] font-mono uppercase font-bold px-2 py-0.2 rounded ${
                              req.priority === 'emergency'
                                ? 'bg-rose-100 text-rose-800'
                                : req.priority === 'urgent'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {req.priority}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block">
                          {req.hospitalName} &bull; {req.hospitalCity}
                        </span>
                      </div>
                    </div>

                    <span className="font-mono text-xl font-bold text-slate-900">
                      {req.quantityLitres.toFixed(1)} <span className="text-xs font-normal text-slate-500">units</span>
                    </span>
                  </div>

                  {/* Justification & Predictive Context */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs space-y-1">
                    <span className="font-semibold text-slate-800 block">
                      Clinical Justification:
                    </span>
                    <p className="text-slate-600 leading-relaxed">
                      {req.reason || 'Anticipated bedside blood stockout.'}
                    </p>
                  </div>

                  {/* Timestamp & Requester */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                    <span>Submitted by: {req.submittedBy}</span>
                    <span>{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Approval Actions (Section 36) */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRejectModalReq(req)}
                      disabled={actionInProgress === req.id}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(req)}
                      disabled={actionInProgress === req.id}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{actionInProgress === req.id ? 'Authorizing...' : 'Approve & Match'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Approved & Active Refills */}
        {approvedRequests.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <h2 className="font-poppins font-bold text-base text-slate-900">
              Active Authorized Allocations ({approvedRequests.length})
            </h2>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Request ID</th>
                    <th className="py-2.5 px-4">Hospital</th>
                    <th className="py-2.5 px-4">Group</th>
                    <th className="py-2.5 px-4 text-right">Quantity</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {approvedRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{r.displayId}</td>
                      <td className="py-3 px-4 text-slate-700">{r.hospitalName}</td>
                      <td className="py-3 px-4 font-poppins font-bold text-slate-900">{r.bloodGroup}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{r.quantityLitres.toFixed(1)} U</td>
                      <td className="py-3 px-4">
                        <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          to={`/hospital/requests/${r.id}/matching`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md"
                        >
                          <span>Load Balancer</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {rejectModalReq && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="font-poppins font-bold text-base text-slate-900">
                Reject Refill Request ({rejectModalReq.displayId})
              </h3>
              <p className="text-xs text-slate-500">
                Please specify an official reason for rejection to maintain regulatory audit trail.
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-rose-500"
                required
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
