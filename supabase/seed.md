# Seed Data Documentation

This document describes the seed data available for local development.

## Quick Start

To load the seed data, run:

```bash
bun x supabase db reset
```

This will reset the database, apply all migrations, and load the seed data.

## Test Users

All users have the password: `password123`

| Email | Display Name | Preferred Currency | Theme | Accounts |
|-------|--------------|-------------------|-------|----------|
| alice@example.com | Alice Johnson | EUR | system | 3 (personal + 2 shared) |
| bob@example.com | Bob Smith | USD | dark | 2 (personal + 1 shared) |
| charlie@example.com | Charlie Brown | GBP | light | 2 (personal + 1 shared) |

## Accounts

### Personal Accounts

| Account | Owner | Currency | Icon | Color |
|---------|-------|----------|------|-------|
| Alice Personal | Alice | EUR | wallet | #6366f1 (indigo) |
| Bob Personal | Bob | USD | wallet | #22c55e (green) |
| Charlie Personal | Charlie | GBP | wallet | #f59e0b (amber) |

### Shared Accounts

| Account | Members | Currency | Icon | Color |
|---------|---------|----------|------|-------|
| Household (Alice & Bob) | Alice (owner), Bob (member) | EUR | home | #ec4899 (pink) |
| Project Alpha | Alice (owner), Charlie (member) | EUR | briefcase | #8b5cf6 (violet) |

## Categories

### Alice's Personal Categories
- Food & Dining (utensils, red)
- Transportation (car, blue)
- Shopping (shopping-bag, violet)
- Entertainment (film, amber)
- Health (heart-pulse, pink)

### Bob's Personal Categories
- Food (utensils, red)
- Tech & Gadgets (laptop, blue)
- Sports (dumbbell, green)
- Subscriptions (credit-card, violet)

### Charlie's Personal Categories
- Food & Drink (coffee, red)
- Travel (plane, blue)
- Books & Learning (book-open, green)

### Household Categories
- Groceries (shopping-cart, green)
- Utilities (zap, amber)
- Rent & Housing (home, indigo)
- Entertainment (tv, pink)

### Project Alpha Categories
- Software & Tools (code, blue)
- Hosting & Cloud (cloud, violet)
- Marketing (megaphone, amber)

## Tags

### Alice's Personal Tags
- Urgent (red)
- Recurring (blue)
- Business (green)

### Bob's Personal Tags
- Personal (indigo)
- Work (amber)

### Charlie's Personal Tags
- Vacation (pink)
- Education (blue)

### Household Tags
- Weekly (green)
- Monthly (violet)
- Essential (red)

### Project Alpha Tags
- MVP (green)
- Launch (amber)

## Expenses Summary

| Account | Total Expenses | By User | Date Range |
|---------|----------------|---------|------------|
| Alice Personal | 20 | Alice: 20 | Jan-Dec 2025 |
| Bob Personal | 16 | Bob: 16 | Jan-Dec 2025 |
| Charlie Personal | 14 | Charlie: 14 | Jan-Dec 2025 |
| Household | 20 | Alice: 10, Bob: 10 | Jan-Dec 2025 |
| Project Alpha | 16 | Alice: 8, Charlie: 8 | Jan-Dec 2025 |
| **Total** | **86** | | |

Expenses are distributed across all months of 2025 to provide realistic year-long data for testing charts, filters, and date-based features.

## Multi-Currency Expenses

The seed data includes expenses in different currencies to test exchange rate features:

- **EUR** - Most expenses (default for Alice, Household, Project Alpha)
- **USD** - Bob's default, some of Alice's purchases, project subscriptions
- **GBP** - Charlie's default, some cross-border purchases

## User IDs (for testing)

```
Alice:   11111111-1111-1111-1111-111111111111
Bob:     22222222-2222-2222-2222-222222222222
Charlie: 33333333-3333-3333-3333-333333333333
```

## Account IDs (for testing)

```
Alice Personal:    aaaa1111-0000-0000-0000-000000000001
Bob Personal:      bbbb2222-0000-0000-0000-000000000001
Charlie Personal:  cccc3333-0000-0000-0000-000000000001
Household:         abab1212-0000-0000-0000-000000000001
Project Alpha:     acac1313-0000-0000-0000-000000000001
```

## Testing Scenarios

### Shared Account Testing
1. Log in as Alice - see Household and Project Alpha
2. Log in as Bob - see Household only
3. Log in as Charlie - see Project Alpha only

### Multi-Currency Testing
1. Alice's account (EUR) with USD purchases shows conversion
2. Charlie's account (GBP) with EUR expenses shows conversion
3. Project Alpha (EUR) with USD and GBP expenses

### Date Range Testing
- Expenses span all 12 months of 2025
- Filter by month, quarter, or custom date ranges
- Test year-to-date summaries and monthly comparisons

### Role Testing
- Alice is owner of all her shared accounts (can edit settings, invite)
- Bob and Charlie are members (can add expenses, view only)

### Tag Testing
- Filter expenses by tags (Recurring, Weekly, MVP, etc.)
- Multiple tags on single expense (e.g., rent is both Monthly and Essential)
