'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { EditGroupModal } from '@/app/components/EditGroupModal';
import { ExpenseModal } from '@/app/components/ExpenseModal';
import { DeleteConfirmationModal } from '@/app/components/DeleteConfirmationModal';

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  createdAt: Date;
}

interface Group {
  id: string;
  name: string;
  totalExpenses: number;
  members: string[];
  createdAt: Date;
}

interface MemberBalance {
  member: string;
  paid: number;
  owes: number;
  netBalance: number;
}

interface Member {
  id: string;
  name: string;
}

function ExpenseSummary({ expenses, members }: { expenses: Expense[]; members: string[] }) {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balances: MemberBalance[] = members.map(member => {
    const paid = expenses
      .filter(e => e.paidBy === member)
      .reduce((sum, e) => sum + e.amount, 0);

    const owes = expenses.reduce((sum, e) => {
      if (e.splitBetween.includes(member)) {
        return sum + (e.amount / e.splitBetween.length);
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
        <div className="text-gray-600">
          Total Expenses: <span className="font-medium text-gray-900">{formatCurrency(totalExpenses)}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {balances.map(({ member, paid, owes, netBalance }) => (
            <div key={member} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-700 font-medium text-sm">
                    {member[0].toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-gray-900 text-sm truncate">
                  {member}
                </span>
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid:</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Owes:</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(owes)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Net:</span>
                  <span className={netBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(netBalance)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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

export default function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

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
        setExpenses(expensesData);
        setAllMembers(membersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleEditGroup = async (id: string, name: string, members: string[]) => {
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
  }) => {
    try {
      const response = await fetch(`/api/groups/${id}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expense),
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      const newExpense = await response.json();
      setExpenses((prev) => [...prev, newExpense]);
      setGroup((prev) => 
        prev ? { ...prev, totalExpenses: prev.totalExpenses + expense.amount } : null
      );
      setIsAddingExpense(false);
    } catch (error) {
      console.error('Error adding expense:', error);
      setIsAddingExpense(false);
    }
  };

  const handleEditExpense = async (expenseData: {
    description: string;
    amount: number;
    paidBy: string;
    splitBetween: string[];
  }) => {
    if (!editingExpense) return;

    try {
      // First validate that paidBy is still a member
      if (!group?.members.includes(expenseData.paidBy)) {
        throw new Error('Payer must be a member of the group');
      }

      // Validate that all split members are group members
      const invalidMembers = expenseData.splitBetween.filter(
        member => !group?.members.includes(member)
      );
      if (invalidMembers.length > 0) {
        throw new Error(`Invalid members in split: ${invalidMembers.join(', ')}`);
      }

      const response = await fetch(`/api/groups/${id}/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || 'Failed to update expense'
        );
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
      alert(error instanceof Error ? error.message : 'Failed to update expense');
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
          ? { ...prev, totalExpenses: prev.totalExpenses - deletedExpense.amount }
          : null
      );
      
      setDeletingExpense(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
      setDeletingExpense(null);
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h1>
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
                onClick={() => setIsAddingExpense(true)}
                className="bg-indigo-700 text-white px-4 py-2 rounded-md hover:bg-indigo-800 transition-colors"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>

        <ExpenseSummary expenses={expenses} members={group.members} />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {expenses.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No expenses yet. Add one to get started!
              </div>
            ) : (
              expenses.map((expense) => (
                <div key={expense.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {expense.description}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Paid by {expense.paidBy} • Split between{' '}
                        {expense.splitBetween.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingExpense(expense)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit expense"
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
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete expense"
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
      </main>
    </div>
  );
} 