export interface Member {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  totalExpenses: number;
  members: string[];
  createdAt: Date;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
  createdAt: Date;
  type: 'expense' | 'settlement';
}

export interface MemberBalance {
  member: string;
  paid: number;
  owes: number;
  netBalance: number;
}
