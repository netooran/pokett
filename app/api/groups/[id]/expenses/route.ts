import { NextResponse } from 'next/server';
import { store } from '@/app/lib/store';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  const expenses = await store.getGroupExpenses(id);

  if (!expenses) {
    return new NextResponse('Group not found', { status: 404 });
  }

  return NextResponse.json(expenses);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params;
  const { description, amount, paidBy, splitBetween, type } = await request.json();

  const newExpense = await store.addExpense(
    id,
    description,
    amount,
    paidBy,
    splitBetween,
    type
  );

  return NextResponse.json(newExpense);
}
