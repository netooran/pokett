import { NextResponse } from 'next/server';
import { store } from '@/app/lib/store';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; expenseId: string }> }
): Promise<NextResponse> {
  try {
    const { id, expenseId } = await context.params;
    const { description, amount, paidBy, splitBetween } = await request.json();

    // Get the group first to validate members
    const group = store.getGroup(id);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Validate that paidBy is a member
    if (!group.members.includes(paidBy)) {
      return NextResponse.json(
        { error: 'Payer must be a member of the group' },
        { status: 400 }
      );
    }

    // Validate that all split members are group members
    const invalidMembers = splitBetween.filter(
      member => !group.members.includes(member)
    );
    if (invalidMembers.length > 0) {
      return NextResponse.json(
        { error: `Invalid members in split: ${invalidMembers.join(', ')}` },
        { status: 400 }
      );
    }
    
    const updatedExpense = store.updateExpense(
      id,
      expenseId,
      description,
      amount,
      paidBy,
      splitBetween
    );
    
    if (!updatedExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; expenseId: string }> }
): Promise<NextResponse> {
  try {
    const { id, expenseId } = await context.params;
    
    // Check if both id and expenseId exist
    if (!id || !expenseId) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    const deleted = store.deleteExpense(id, expenseId);
    
    if (!deleted) {
      return new NextResponse('Expense not found', { status: 404 });
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 