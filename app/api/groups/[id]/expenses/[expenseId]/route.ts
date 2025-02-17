import { NextResponse } from 'next/server';
import { store } from '@/app/lib/store';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; expenseId: string }> }
): Promise<NextResponse> {
  const { id, expenseId } = await context.params;
  const { description, amount, paidBy, splitBetween } = await request.json();
  
  const updatedExpense = store.updateExpense(
    id,
    expenseId,
    description,
    amount,
    paidBy,
    splitBetween
  );
  
  if (!updatedExpense) {
    return new NextResponse('Expense not found', { status: 404 });
  }
  
  return NextResponse.json(updatedExpense);
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