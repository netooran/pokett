interface Member {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  totalExpenses: number;
  members: string[];
  createdAt: Date;
}

interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  createdAt: Date;
}

// In-memory data store
class Store {
  private members: Member[] = [
    { id: '1', name: 'John' },
    { id: '2', name: 'Sarah' },
    { id: '3', name: 'Mike' },
    { id: '4', name: 'Anna' },
    { id: '5', name: 'Alex' },
    { id: '6', name: 'Chris' },
  ];

  private groups: Group[] = [
    {
      id: '1',
      name: 'Weekend Trip',
      totalExpenses: 1250.5,
      members: ['John', 'Sarah', 'Mike', 'Anna'],
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      name: 'Roommates',
      totalExpenses: 3425.75,
      members: ['You', 'Alex', 'Chris'],
      createdAt: new Date('2024-02-01'),
    },
  ];

  private expenses: Expense[] = [
    {
      id: '1',
      groupId: '1',
      description: 'Dinner',
      amount: 2500,
      paidBy: 'John',
      splitBetween: ['John', 'Sarah', 'Mike', 'Anna'],
      createdAt: new Date('2024-02-15'),
    },
    {
      id: '2',
      groupId: '1',
      description: 'Taxi',
      amount: 800,
      paidBy: 'Sarah',
      splitBetween: ['Sarah', 'Mike'],
      createdAt: new Date('2024-02-16'),
    },
  ];

  // Add a utility function for formatting currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // Member methods
  getAllMembers(): Member[] {
    return this.members;
  }

  addMember(name: string): Member {
    const newMember: Member = {
      id: Date.now().toString(),
      name,
    };
    this.members.push(newMember);
    return newMember;
  }

  // Group methods
  getAllGroups(): Group[] {
    return this.groups;
  }

  addGroup(name: string, members: string[]): Group {
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      totalExpenses: 0,
      members,
      createdAt: new Date(),
    };
    this.groups.push(newGroup);
    return newGroup;
  }

  // Add edit method
  editGroup(id: string, name: string, members: string[]): Group | null {
    const group = this.groups.find((g) => g.id === id);
    if (group) {
      group.name = name;
      group.members = members;
      return {
        ...group,
        members: [...members], // Ensure we return a new array
      };
    }
    return null;
  }

  // Add delete method
  deleteGroup(id: string): boolean {
    const index = this.groups.findIndex((g) => g.id === id);
    if (index !== -1) {
      this.groups.splice(index, 1);
      return true;
    }
    return false;
  }

  getGroup(id: string): Group | null {
    return this.groups.find((g) => g.id === id) || null;
  }

  getGroupExpenses(groupId: string): Expense[] {
    return this.expenses.filter((expense) => expense.groupId === groupId);
  }

  addExpense(
    groupId: string,
    description: string,
    amount: number,
    paidBy: string,
    splitBetween: string[]
  ): Expense {
    const newExpense: Expense = {
      id: Date.now().toString(),
      groupId,
      description,
      amount,
      paidBy,
      splitBetween,
      createdAt: new Date(),
    };
    this.expenses.push(newExpense);

    // Update group total
    const group = this.groups.find((g) => g.id === groupId);
    if (group) {
      group.totalExpenses += amount;
    }

    return newExpense;
  }

  updateExpense(
    groupId: string,
    expenseId: string,
    description: string,
    amount: number,
    paidBy: string,
    splitBetween: string[]
  ): Expense | null {
    const expense = this.expenses.find(
      (e) => e.id === expenseId && e.groupId === groupId
    );
    if (!expense) return null;

    // Update group total
    const group = this.groups.find((g) => g.id === groupId);
    if (group) {
      group.totalExpenses = group.totalExpenses - expense.amount + amount;
    }

    // Update expense
    expense.description = description;
    expense.amount = amount;
    expense.paidBy = paidBy;
    expense.splitBetween = splitBetween;

    return expense;
  }

  deleteExpense(groupId: string, expenseId: string): boolean {
    const expense = this.expenses.find(
      (e) => e.id === expenseId && e.groupId === groupId
    );
    if (!expense) return false;

    // Update group total
    const group = this.groups.find((g) => g.id === groupId);
    if (group) {
      group.totalExpenses -= expense.amount;
    }

    // Remove expense
    this.expenses = this.expenses.filter(
      (e) => !(e.id === expenseId && e.groupId === groupId)
    );

    return true;
  }
}

// Create a singleton instance
export const store = new Store();
