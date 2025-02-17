'use client';

import { useState } from 'react';
import { Group } from '@/types/models';

interface ExpenseModalProps {
  group: Group;
  onClose: () => void;
  onSubmit: (expense: {
    description: string;
    amount: number;
    paidBy: string;
    splitBetween: string[];
  }) => void;
  expense?: {
    id: string;
    description: string;
    amount: number;
    paidBy: string;
    splitBetween: string[];
  };
}

export function ExpenseModal({
  group,
  onClose,
  onSubmit,
  expense,
}: ExpenseModalProps) {
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount.toString() || '');
  const [paidBy, setPaidBy] = useState(
    expense?.paidBy || group.members[0] || ''
  );
  const [splitBetween, setSplitBetween] = useState<string[]>(
    expense?.splitBetween || group.members
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description && amount && paidBy && splitBetween.length > 0) {
      onSubmit({
        description: description.trim(),
        amount: parseFloat(amount),
        paidBy,
        splitBetween,
      });
    }
  };

  const handleSplitMemberToggle = (member: string) => {
    setSplitBetween((current) =>
      current.includes(member)
        ? current.filter((m) => m !== member)
        : [...current, member]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {expense ? 'Edit Expense' : 'Add Expense'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-sm"
              placeholder="What was this expense for?"
              required
            />
          </div>

          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Amount
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-sm"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label
              htmlFor="paidBy"
              className="block text-sm font-medium text-gray-900 mb-1"
            >
              Paid By
            </label>
            <select
              id="paidBy"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent shadow-sm"
              required
            >
              {group.members.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Split Between
            </label>
            <div className="flex flex-wrap gap-2">
              {group.members.map((member) => (
                <button
                  key={member}
                  type="button"
                  onClick={() => handleSplitMemberToggle(member)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    splitBetween.includes(member)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {member}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-700 text-white px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors font-medium"
            >
              {expense ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
