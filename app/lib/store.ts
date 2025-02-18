import { Group, Member, Expense } from '@/types/models';
import { connectToDatabase } from './mongodb';

class Store {
  // Member methods
  async getAllMembers(): Promise<Member[]> {
    const { db } = await connectToDatabase();
    const members = await db.collection('members').find({}).toArray();
    return members;
  }

  async addMember(name: string): Promise<Member> {
    const { db } = await connectToDatabase();
    const newMember: Member = {
      id: Date.now().toString(),
      name,
    };
    await db.collection('members').insertOne(newMember);
    return newMember;
  }

  // Group methods
  async getAllGroups(): Promise<Group[]> {
    const { db } = await connectToDatabase();
    const groups = await db.collection('groups').find({}).toArray();
    return groups;
  }

  async addGroup(name: string, members: string[]): Promise<Group> {
    const { db } = await connectToDatabase();
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      totalExpenses: 0,
      members,
      createdAt: new Date(),
    };
    await db.collection('groups').insertOne(newGroup);
    return newGroup;
  }

  // Add edit method
  async editGroup(
    id: string,
    name: string,
    members: string[]
  ): Promise<Group | null> {
    const { db } = await connectToDatabase();
    const group = await db.collection('groups').findOne({ id });
    if (!group) return null;

    // Check which members are being removed
    const removedMembers = group.members.filter(
      (member: string) => !members.includes(member)
    );

    // Get all expenses for this group
    const expenses = await db
      .collection('expenses')
      .find({ groupId: id })
      .toArray();

    // Check if any removed member is part of expenses
    const membersInExpenses = removedMembers.filter((member: string) =>
      expenses.some(
        (expense: Expense) =>
          expense.paidBy === member || expense.splitBetween.includes(member)
      )
    );

    if (membersInExpenses.length > 0) {
      throw new Error(
        `Cannot remove members that are part of expenses: ${membersInExpenses.join(
          ', '
        )}`
      );
    }

    const updatedGroup = await db
      .collection('groups')
      .findOneAndUpdate(
        { id },
        { $set: { name, members } },
        { returnDocument: 'after' }
      );

    return updatedGroup;
  }

  // Add delete method
  async deleteGroup(id: string): Promise<boolean> {
    const { db } = await connectToDatabase();
    const result = await db.collection('groups').deleteOne({ id });
    return result.deletedCount > 0;
  }

  async getGroup(id: string): Promise<Group | null> {
    const { db } = await connectToDatabase();
    return (await db.collection('groups').findOne({ id })) || null;
  }

  async getGroupExpenses(groupId: string): Promise<Expense[]> {
    const { db } = await connectToDatabase();
    return await db.collection('expenses').find({ groupId }).toArray();
  }

  async addExpense(
    groupId: string,
    description: string,
    amount: number,
    paidBy: string,
    splitBetween: string[],
    type: 'expense' | 'settlement' = 'expense'
  ): Promise<Expense> {
    const { db } = await connectToDatabase();

    const newExpense: Expense = {
      id: Date.now().toString(),
      groupId,
      description,
      amount,
      paidBy,
      splitBetween,
      createdAt: new Date(),
      type,
    };

    await db.collection('expenses').insertOne(newExpense);

    // Update group total
    await db
      .collection('groups')
      .updateOne({ id: groupId }, { $inc: { totalExpenses: amount } });

    return newExpense;
  }

  async updateExpense(
    groupId: string,
    expenseId: string,
    description: string,
    amount: number,
    paidBy: string,
    splitBetween: string[]
  ): Promise<Expense | null> {
    const { db } = await connectToDatabase();

    // Find existing expense
    const expense = await db.collection('expenses').findOne({
      id: expenseId,
      groupId: groupId,
    });
    if (!expense) return null;

    // Update expense
    await db.collection('expenses').updateOne(
      { id: expenseId, groupId: groupId },
      {
        $set: {
          description,
          amount,
          paidBy,
          splitBetween,
        },
      }
    );

    // Update group total
    await db
      .collection('groups')
      .updateOne(
        { id: groupId },
        { $inc: { totalExpenses: amount - expense.amount } }
      );

    return {
      ...expense,
      description,
      amount,
      paidBy,
      splitBetween,
    };
  }

  async deleteExpense(groupId: string, expenseId: string): Promise<boolean> {
    const { db } = await connectToDatabase();

    // Find existing expense
    const expense = await db.collection('expenses').findOne({
      id: expenseId,
      groupId: groupId,
    });
    if (!expense) return false;

    // Remove expense
    await db.collection('expenses').deleteOne({
      id: expenseId,
      groupId: groupId,
    });

    // Update group total
    await db
      .collection('groups')
      .updateOne({ id: groupId }, { $inc: { totalExpenses: -expense.amount } });

    return true;
  }

  // Add this method to check if a member is part of any expenses in a group
  async isMemberInGroupExpenses(
    groupId: string,
    memberName: string
  ): Promise<boolean> {
    const { db } = await connectToDatabase();

    const expense = await db.collection('expenses').findOne({
      groupId,
      $or: [{ paidBy: memberName }, { splitBetween: memberName }],
    });

    return expense !== null;
  }
}

// Create a singleton instance
export const store = new Store();
