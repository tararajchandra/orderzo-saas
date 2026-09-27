# Expense Database Issue - Fixed

## Problem
Expenses were not being saved to the database. Instead, they were being stored in the browser's localStorage, which meant:
- Expenses were not persisted across different browsers or devices
- Expenses were lost when browser data was cleared
- No centralized database storage for reporting and analytics

## Root Cause
The cashbook page (`app/admin/cashbook/page.tsx`) had two issues:

1. **`handleAddExpense` function** (lines 98-127): Was saving expenses to localStorage instead of calling the `/api/expenses` POST endpoint
2. **`fetchCashTransactions` function** (lines 44-86): Was loading expenses from localStorage instead of fetching from the `/api/expenses` GET endpoint

## Solution Applied

### 1. Updated `handleAddExpense` Function
Changed from localStorage storage to API call:

```typescript
const handleAddExpense = async () => {
    if (!expenseDescription || !expenseAmount) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: expenseDescription,
                amount: parseFloat(expenseAmount),
                category: 'Expense',
                date: new Date().toISOString().split('T')[0],
                payment_method: 'cash',
                notes: '',
            }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to add expense');
        }

        // Reset form and refresh
        setExpenseDescription('');
        setExpenseAmount('');
        setShowExpenseForm(false);
        fetchCashTransactions();
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Failed to add expense. Please try again.');
    }
};
```

### 2. Updated `fetchCashTransactions` Function
Changed from localStorage retrieval to API call:

```typescript
const fetchCashTransactions = async () => {
    try {
        // Fetch orders for cash sales
        const ordersResponse = await fetch('/api/orders');
        const ordersData = await ordersResponse.json();

        // Fetch expenses from database
        const expensesResponse = await fetch('/api/expenses');
        const expensesData = await expensesResponse.json();

        if (ordersData.success) {
            // Filter cash transactions
            const cashSales = ordersData.data
                .filter((order: any) => order.payment_method === 'cash')
                .map((order: any) => ({
                    id: `sale-${order.id}`,
                    date: order.created_at,
                    description: `Sale - ${order.customer_name} (${order.invoice_number || `Order #${order.id}`})`,
                    type: 'in' as const,
                    amount: parseFloat(order.total_amount),
                    category: 'Sales',
                }));

            // Map expenses from database
            const expenses = expensesData.success ? expensesData.data.map((expense: any) => ({
                id: `expense-${expense.id}`,
                date: expense.date,
                description: expense.description,
                type: 'out' as const,
                amount: parseFloat(expense.amount),
                category: expense.category,
            })) : [];

            // Combine and sort by date
            const allTransactions = [...cashSales, ...expenses].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            // Calculate running balance
            let balance = openingBalance;
            const transactionsWithBalance = allTransactions.map(txn => {
                balance += txn.type === 'in' ? txn.amount : -txn.amount;
                return { ...txn, balance };
            });

            setTransactions(transactionsWithBalance);
        }
    } catch (error) {
        console.error('Error fetching cash transactions:', error);
    } finally {
        setLoading(false);
    }
};
```

### 3. Database Migration
Ran the expenses table migration to ensure the table exists:
```bash
node scripts/run_expenses_migration.js
```

## Database Schema
The expenses table has the following structure:

```sql
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50),
    receipt_image_id INTEGER REFERENCES images(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints
The following API endpoints are available for expense management:

- **POST `/api/expenses`**: Create a new expense
- **GET `/api/expenses`**: Fetch all expenses (with optional filters)
- **PUT `/api/expenses/[id]`**: Update an expense
- **DELETE `/api/expenses/[id]`**: Delete an expense

## Testing
To verify the fix:

1. Navigate to the Cash Book page (`/admin/cashbook`)
2. Click "+ Add Expense"
3. Fill in the description and amount
4. Click "Add"
5. The expense should now be saved to the database
6. Refresh the page - the expense should still be visible
7. Check the database directly to confirm the expense was inserted

## Benefits
✅ Expenses are now persisted in the database  
✅ Expenses are accessible across all devices and browsers  
✅ Expenses can be used for reporting and analytics  
✅ Proper error handling and user feedback  
✅ Data integrity and consistency maintained
