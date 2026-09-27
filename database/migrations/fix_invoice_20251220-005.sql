-- Fix invoice total for order #20251220-005
-- This updates the invoice total to match the order total

UPDATE invoices i
SET total = o.total_amount,
    subtotal = o.subtotal,
    tax = o.tax,
    discount = o.discount
FROM orders o
WHERE i.order_id = o.id
  AND o.order_number = '20251220-005';

-- Verify the fix
SELECT 
    o.order_number,
    o.total_amount as order_total,
    i.total as invoice_total,
    o.subtotal as order_subtotal,
    i.subtotal as invoice_subtotal
FROM orders o
JOIN invoices i ON i.order_id = o.id
WHERE o.order_number = '20251220-005';
