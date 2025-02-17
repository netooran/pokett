'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { EditGroupModal } from '@/app/components/EditGroupModal';
import { ExpenseModal } from '@/app/components/ExpenseModal';
import { DeleteConfirmationModal } from '@/app/components/DeleteConfirmationModal';
import { SettleExpenseModal } from '@/app/components/SettleExpenseModal';
import { Group, Member, Expense, MemberBalance } from '@/types/models';

function calculateBalances(
  expenses: Expense[],
  members: string[]
): MemberBalance[] {
  return members.map((member) => {
    const paid = expenses
      .filter((e) => e.paidBy === member)
      .reduce((sum, e) => sum + e.amount, 0);

    const owes = expenses.reduce((sum, e) => {
      if (e.splitBetween.includes(member)) {
        return sum + e.amount / e.splitBetween.length;
      }
      return sum;
    }, 0);

    return {
      member,
      paid,
      owes,
      netBalance: paid - owes,
    };
  });
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

// Add this helper function near the top with other utility functions
const formatDate = (date: Date): string => {
  const now = new Date();
  const expenseDate = new Date(date);

  // If it's today, show time
  if (expenseDate.toDateString() === now.toDateString()) {
    return `Today, ${expenseDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  }

  // If it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (expenseDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // If it's within this year, show date without year
  if (expenseDate.getFullYear() === now.getFullYear()) {
    return expenseDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  // Otherwise show full date
  return expenseDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function isGroupFullySettled(balances: MemberBalance[]): boolean {
  return balances.every((balance) => balance.netBalance === 0);
}

export default function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupRes, expensesRes, membersRes] = await Promise.all([
          fetch(`/api/groups/${id}`),
          fetch(`/api/groups/${id}/expenses`),
          fetch('/api/members'),
        ]);

        const [groupData, expensesData, membersData] = await Promise.all([
          groupRes.json(),
          expensesRes.json(),
          membersRes.json(),
        ]);

        setGroup(groupData);
        setExpenses(
          expensesData.sort(
            (a: Expense, b: Expense) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        setAllMembers(membersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const balances = calculateBalances(expenses, group?.members || []);
  const fullySettled = isGroupFullySettled(balances);
  const hasPendingSettlements = balances.some(
    (balance) => balance.netBalance !== 0
  );

  const handleEditGroup = async (
    id: string,
    name: string,
    members: string[]
  ) => {
    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, members }),
      });

      if (!response.ok) throw new Error('Failed to update group');

      const updatedGroup = await response.json();
      setGroup(updatedGroup);
      setIsEditingGroup(false);
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Failed to update group. Please try again.');
    }
  };

  const handleAddExpense = async (expense: {
    description: string;
    amount: number;
    paidBy: string;
    splitBetween: string[];
    type: 'expense';
  }) => {
    try {
      const response = await fetch(`/api/groups/${id}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense),
      });

      if (!response.ok) throw new Error('Failed to add expense');

      const newExpense = await response.json();
      setExpenses((prev) => [newExpense, ...prev]);
      setGroup((prev) =>
        prev
          ? { ...prev, totalExpenses: prev.totalExpenses + expense.amount }
          : null
      );
      setIsAddingExpense(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  const handleEditExpense = async (expenseData: {
    description: string;
    amount: number;
    paidBy: string;
    splitBetween: string[];
    type: 'expense' | 'settlement';
  }) => {
    if (!editingExpense) return;

    try {
      // First validate that paidBy is still a member
      if (!group?.members.includes(expenseData.paidBy)) {
        throw new Error('Payer must be a member of the group');
      }

      // Validate that all split members are group members
      const invalidMembers = expenseData.splitBetween.filter(
        (member) => !group?.members.includes(member)
      );
      if (invalidMembers.length > 0) {
        throw new Error(
          `Invalid members in split: ${invalidMembers.join(', ')}`
        );
      }

      const response = await fetch(
        `/api/groups/${id}/expenses/${editingExpense.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expenseData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to update expense');
      }

      const updatedExpense = await response.json();

      setExpenses((prev) =>
        prev.map((exp) => (exp.id === editingExpense.id ? updatedExpense : exp))
      );

      setGroup((prev) => {
        if (!prev) return null;
        const oldAmount = editingExpense.amount;
        const newAmount = expenseData.amount;
        return {
          ...prev,
          totalExpenses: prev.totalExpenses - oldAmount + newAmount,
        };
      });

      setEditingExpense(null);
    } catch (error) {
      console.error('Error updating expense:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to update expense'
      );
      setEditingExpense(null);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      // Find the expense before deletion to ensure we have the data
      const deletedExpense = expenses.find((e) => e.id === expenseId);
      if (!deletedExpense) {
        throw new Error('Expense not found');
      }

      const response = await fetch(`/api/groups/${id}/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete expense');
      }

      // Update expenses list
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));

      // Update group total
      setGroup((prev) =>
        prev
          ? {
              ...prev,
              totalExpenses: prev.totalExpenses - deletedExpense.amount,
            }
          : null
      );

      setDeletingExpense(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
      setDeletingExpense(null);
    }
  };

  const handleSettle = async (settlement: {
    from: string;
    to: string;
    amount: number;
    description?: string;
    type: 'settlement';
  }) => {
    try {
      const response = await fetch(`/api/groups/${id}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description:
            settlement.description ||
            `Settlement from ${settlement.from} to ${settlement.to}`,
          amount: settlement.amount,
          paidBy: settlement.from,
          splitBetween: [settlement.to],
          type: 'settlement',
        }),
      });

      if (!response.ok) throw new Error('Failed to save settlement');

      const newSettlement = await response.json();
      setExpenses((prev) => [newSettlement, ...prev]);
      setGroup((prev) =>
        prev
          ? { ...prev, totalExpenses: prev.totalExpenses + settlement.amount }
          : null
      );
      setIsSettling(false);
    } catch (error) {
      console.error('Error saving settlement:', error);
      alert('Failed to save settlement. Please try again.');
    }
  };

  if (isLoading || !group) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/groups"
            className="text-indigo-600 hover:text-indigo-700 mb-2 inline-block"
          >
            ← Back to Groups
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {group.name}
              </h1>
              <div className="flex flex-wrap gap-2">
                {group.members.map((member) => (
                  <span
                    key={member}
                    className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-sm font-medium"
                  >
                    {member}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditingGroup(true)}
                className="bg-white text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-200"
              >
                Edit Group
              </button>
              <button
                onClick={() => setIsSettling(true)}
                className="bg-white text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-50 transition-colors border border-indigo-200"
              >
                Settle
              </button>
              <button
                onClick={() => setIsAddingExpense(true)}
                className="bg-indigo-700 text-white px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Expenses
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {expenses.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No expenses yet. Add one to get started!
                  </div>
                ) : (
                  expenses
                    .sort(
                      (a: Expense, b: Expense) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )
                    .map((expense) => (
                      <div key={expense.id} className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {expense.type === 'settlement' ? (
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-green-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-indigo-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-medium text-gray-900 truncate">
                              {expense.description}
                            </h3>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {expense.type === 'settlement' ? (
                                <>
                                  Payment by {expense.paidBy} to{' '}
                                  {expense.splitBetween[0]}
                                </>
                              ) : (
                                <>
                                  Paid by {expense.paidBy} • Split between{' '}
                                  {expense.splitBetween.join(', ')}
                                </>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="flex items-baseline gap-3">
                              <span className="text-sm text-gray-500 whitespace-nowrap">
                                {formatDate(expense.createdAt)}
                              </span>
                              <div className="text-base font-medium text-gray-900 whitespace-nowrap">
                                {formatCurrency(expense.amount)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingExpense(expense)}
                                className={`text-gray-400 transition-colors p-1 ${
                                  expense.type === 'settlement'
                                    ? 'cursor-not-allowed opacity-50'
                                    : 'hover:text-gray-600'
                                }`}
                                title={
                                  expense.type === 'settlement'
                                    ? 'Settlements cannot be edited'
                                    : 'Edit expense'
                                }
                                disabled={expense.type === 'settlement'}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-5 h-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeletingExpense(expense)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                title={`Delete ${expense.type}`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-5 h-5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Summary
                  </h2>
                  <div className="text-gray-600">
                    Total:{' '}
                    <span className="font-medium text-gray-900">
                      {formatCurrency(group.totalExpenses)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {fullySettled && (
                  <div className="bg-green-100 text-green-800 p-2 rounded-md">
                    This group is fully settled!
                  </div>
                )}
                {hasPendingSettlements && !fullySettled && (
                  <div className="bg-yellow-100 text-yellow-800 p-2 rounded-md">
                    There are pending settlements.
                  </div>
                )}
                {calculateBalances(expenses, group.members).map(
                  ({ member, paid, owes, netBalance }) => (
                    <div
                      key={member}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-indigo-700 font-medium">
                          {member[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-900 truncate">
                            {member}
                          </span>
                          <span
                            className={`font-medium ${
                              netBalance >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(netBalance)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Paid {formatCurrency(paid)}</span>
                          <span>•</span>
                          <span>Owes {formatCurrency(owes)}</span>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {calculateBalances(expenses, group.members).some(
                  (b) => b.netBalance !== 0
                ) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      Suggested Settlements
                    </h3>
                    <div className="space-y-2">
                      {calculateSettlements(
                        calculateBalances(expenses, group.members)
                      ).map((settlement, index) => (
                        <div
                          key={index}
                          className="text-sm text-gray-600 flex items-center gap-2"
                        >
                          <span className="font-medium text-gray-900">
                            {settlement.from}
                          </span>
                          <svg
                            className="w-4 h-4"
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
                          <span className="font-medium text-gray-900">
                            {settlement.to}
                          </span>
                          <span className="ml-auto font-medium text-gray-900">
                            {formatCurrency(settlement.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {isEditingGroup && group && (
          <EditGroupModal
            group={group}
            onClose={() => setIsEditingGroup(false)}
            onEdit={handleEditGroup}
            allMembers={allMembers}
            setAllMembers={setAllMembers}
          />
        )}

        {(isAddingExpense || editingExpense) && group && (
          <ExpenseModal
            group={group}
            onClose={() => {
              setIsAddingExpense(false);
              setEditingExpense(null);
            }}
            onSubmit={editingExpense ? handleEditExpense : handleAddExpense}
            expense={editingExpense || undefined}
          />
        )}

        {deletingExpense && (
          <DeleteConfirmationModal
            title="Delete Expense"
            message={`Are you sure you want to delete "${deletingExpense.description}"? This action cannot be undone.`}
            onConfirm={() => handleDeleteExpense(deletingExpense.id)}
            onCancel={() => setDeletingExpense(null)}
          />
        )}

        {isSettling && group && (
          <SettleExpenseModal
            onClose={() => setIsSettling(false)}
            onSettle={handleSettle}
            suggestedSettlements={calculateSettlements(
              calculateBalances(expenses, group.members)
            )}
          />
        )}
      </main>
    </div>
  );
}

function calculateSettlements(
  balances: MemberBalance[]
): Array<{ from: string; to: string; amount: number }> {
  const settlements: Array<{ from: string; to: string; amount: number }> = [];
  const debtors = balances
    .filter((b) => b.netBalance < 0)
    .sort((a, b) => a.netBalance - b.netBalance);
  const creditors = balances
    .filter((b) => b.netBalance > 0)
    .sort((a, b) => b.netBalance - a.netBalance);

  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(
      Math.abs(debtors[i].netBalance),
      creditors[j].netBalance
    );
    if (amount > 0) {
      settlements.push({
        from: debtors[i].member,
        to: creditors[j].member,
        amount,
      });
    }

    debtors[i].netBalance += amount;
    creditors[j].netBalance -= amount;

    if (Math.abs(debtors[i].netBalance) < 0.01) i++;
    if (Math.abs(creditors[j].netBalance) < 0.01) j++;
  }

  return settlements;
}
