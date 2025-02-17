'use client';

import { useState, useEffect, useMemo } from 'react';

interface SettleExpenseModalProps {
  members: string[];
  onClose: () => void;
  onSettle: (settlement: {
    from: string;
    to: string;
    amount: number;
    description?: string;
  }) => void;
  suggestedSettlements: Array<{
    from: string;
    to: string;
    amount: number;
  }>;
}

// Add the formatCurrency utility function
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function SettleExpenseModal({
  members,
  onClose,
  onSettle,
  suggestedSettlements,
}: SettleExpenseModalProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Get members who owe money (debtors)
  const debtors = useMemo(() => {
    const debtorMap = new Map<string, number>();
    suggestedSettlements.forEach(s => {
      const currentTotal = debtorMap.get(s.from) || 0;
      debtorMap.set(s.from, currentTotal + s.amount);
    });
    return Array.from(debtorMap.entries())
      .map(([member, amount]) => ({ member, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [suggestedSettlements]);

  // Get valid receivers for selected payer
  const validReceivers = useMemo(() => {
    if (!from) return [];
    return suggestedSettlements
      .filter(s => s.from === from)
      .map(s => ({ member: s.to, amount: s.amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [from, suggestedSettlements]);

  // Update amount when from/to selection changes
  useEffect(() => {
    if (from && to) {
      const settlement = suggestedSettlements.find(
        s => s.from === from && s.to === to
      );
      if (settlement) {
        setAmount(settlement.amount.toString());
      } else {
        setAmount('');
      }
    } else {
      setAmount('');
    }
  }, [from, to, suggestedSettlements]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settlementAmount = parseFloat(amount);
    if (settlementAmount > 0 && from !== to) {
      onSettle({
        from,
        to,
        amount: settlementAmount,
        description: description.trim() || `Settlement from ${from} to ${to}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Settle Amount</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Who pays
              </label>
              <select
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setTo('');
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="">Select member</option>
                {debtors.map(({ member }) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center self-end pb-2">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Who receives
              </label>
              <select
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                disabled={!from || validReceivers.length === 0}
              >
                <option value="">
                  {!from 
                    ? "Select payer first"
                    : validReceivers.length === 0 
                      ? "No pending payments"
                      : "Select receiver"
                  }
                </option>
                {validReceivers.map(({ member }) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                step="0.01"
                min="0"
                placeholder="₹0.00"
                disabled={!from || !to}
              />
              {from && to && (
                <div className="mt-2 text-sm text-gray-600">
                  {from} owes {to}{' '}
                  <span className="font-medium text-gray-900">
                    {formatCurrency(parseFloat(amount) || 0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note about this settlement"
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!from || !to || !amount || parseFloat(amount) <= 0}
            >
              Confirm Settlement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 