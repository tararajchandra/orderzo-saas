# Invoice Printing Font Size Update

## Summary
Updated all invoice printing functionality to match the KOT (Kitchen Order Ticket) printing style with larger, bolder fonts for better visibility and readability.

## Changes Made

### 1. Invoice Detail Page (`app/admin/invoices/[id]/page.tsx`)

#### Browser Fallback Printing
- **Base font size**: Increased from 14px to 16px
- **Font weight**: Increased from bold to 900 (extra bold)
- **Restaurant name**: Increased from 16px to 20px
- **Address/Phone/GST**: Increased from 12px to 14px
- **Total amount**: Increased from 16px to 20px

#### Thermal Receipt Print Styles
- **Base font size**: Increased from 14px to 16px
- **Font weight**: Increased from 700 to 900 (extra bold)
- **Header (h1)**: Increased from 18px to 22px
- **Subheaders (h2, h3)**: Increased from 15px to 18px with font-weight 900
- **Table font size**: Increased from 14px to 18px
- **Table headers (th)**: Added explicit 18px font size with 900 font-weight
- **Table cells (td)**: Increased font-weight from 700 to 900, added 18px font size

#### USB Raw Print
- **Items**: Added bold styling (bold on/off) around item text for better visibility

### 2. Orders Page (`app/admin/orders/page.tsx`)
- **USB Print Items**: Added bold styling (bold on/off) for items to match KOT style
- Browser fallback already had updated font sizes

### 3. Create Order Page (`app/admin/orders/create/page.tsx`)
- **USB Print Items**: Added bold styling (bold on/off) for items to match KOT style
- Browser fallback already had updated font sizes

### 4. Quick Bill Page (`app/admin/quick-bill/page.tsx`)
- **USB Print Items**: Added bold styling (bold on/off) for items to match KOT style
- Browser fallback already had updated font sizes

## Font Size Comparison

| Element | Before | After |
|---------|--------|-------|
| Base body font | 14px, bold | 16px, 900 |
| Restaurant name | 16px | 20px |
| Address/Contact | 12px | 14px |
| Invoice title | 15px | 18px |
| Table items | 14px, 700 | 18px, 900 |
| Total amount | 16px | 20px |

## Technical Details

### Browser Fallback
All browser fallback printing functions now use:
- Courier New monospace font
- 16px base font size with 900 font-weight
- Larger headers (20-24px)
- Bold styling for emphasis

### USB Thermal Printing
All USB thermal printing now includes:
- `printer.bold(true)` before item text
- `printer.bold(false)` after item text
- `printer.setSize(1, 2)` for double-height items
- Consistent with KOT printing style

## Files Modified
1. `app/admin/invoices/[id]/page.tsx`
2. `app/admin/orders/page.tsx`
3. `app/admin/orders/create/page.tsx`
4. `app/admin/quick-bill/page.tsx`

## Testing Recommendations
1. Test browser fallback printing on all pages
2. Test USB thermal printing with actual printer
3. Verify font sizes are readable on different paper widths (58mm and 80mm)
4. Check that bold styling works correctly on thermal printers
5. Ensure all invoice types (Tax Invoice and Bill of Supply) display correctly
