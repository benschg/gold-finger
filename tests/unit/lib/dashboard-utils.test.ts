import { describe, expect, it } from "vitest";
import { format, subMonths } from "date-fns";
import {
  filterIncomes,
  calculateNetFlow,
  transformToComparisonChartData,
  calculateIncomeCategoryBreakdown,
  buildIncomeCategoryColorMap,
} from "@/lib/dashboard-utils";
import type { IncomeWithCategory, ExpenseWithDetails } from "@/types/database";

// Helper to create mock income
function createMockIncome(
  overrides: Partial<IncomeWithCategory> = {},
): IncomeWithCategory {
  return {
    id: "income-1",
    account_id: "account-1",
    user_id: "user-1",
    amount: 1000,
    currency: "EUR",
    summary: null,
    description: "Test income",
    date: format(new Date(), "yyyy-MM-dd"),
    income_category_id: null,
    income_category: null,
    receipt_url: null,
    converted_amount: null,
    exchange_rate: null,
    account_currency: null,
    rate_date: null,
    recurring_income_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create mock expense
function createMockExpense(
  overrides: Partial<ExpenseWithDetails> = {},
): ExpenseWithDetails {
  return {
    id: "expense-1",
    account_id: "account-1",
    user_id: "user-1",
    amount: 500,
    currency: "EUR",
    summary: "Test expense",
    description: null,
    date: format(new Date(), "yyyy-MM-dd"),
    category_id: null,
    category: null,
    tags: [],
    receipt_url: null,
    has_items: false,
    recurring_expense_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("filterIncomes", () => {
  // Use fixed dates to avoid timezone/boundary issues
  const today = new Date("2024-06-15");
  const lastWeek = new Date("2024-06-08");
  const twoWeeksAgo = new Date("2024-06-01");

  const incomes: IncomeWithCategory[] = [
    createMockIncome({
      id: "1",
      date: "2024-06-15",
      income_category_id: "cat-1",
    }),
    createMockIncome({
      id: "2",
      date: "2024-06-08",
      income_category_id: "cat-2",
    }),
    createMockIncome({
      id: "3",
      date: "2024-06-01",
      income_category_id: "cat-1",
    }),
  ];

  it("should return all incomes when no filters applied", () => {
    const result = filterIncomes(incomes, {});
    expect(result).toHaveLength(3);
  });

  it("should filter by date range", () => {
    const result = filterIncomes(incomes, {
      startDate: lastWeek,
      endDate: today,
    });
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toContain("1");
    expect(result.map((i) => i.id)).toContain("2");
  });

  it("should filter by income category", () => {
    const result = filterIncomes(incomes, {
      incomeCategoryId: "cat-1",
    });
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.income_category_id === "cat-1")).toBe(true);
  });

  it("should combine date and category filters", () => {
    const result = filterIncomes(incomes, {
      startDate: lastWeek,
      endDate: today,
      incomeCategoryId: "cat-1",
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("should return empty array when no matches", () => {
    const result = filterIncomes(incomes, {
      incomeCategoryId: "non-existent",
    });
    expect(result).toHaveLength(0);
  });
});

describe("calculateNetFlow", () => {
  it("should calculate positive net flow when income > expenses", () => {
    const expenses = [
      createMockExpense({ amount: 100 }),
      createMockExpense({ amount: 200 }),
    ];
    const incomes = [
      createMockIncome({ amount: 500 }),
      createMockIncome({ amount: 300 }),
    ];

    const result = calculateNetFlow(expenses, incomes);

    expect(result.totalExpenses).toBe(300);
    expect(result.totalIncome).toBe(800);
    expect(result.netFlow).toBe(500);
  });

  it("should calculate negative net flow when expenses > income", () => {
    const expenses = [
      createMockExpense({ amount: 500 }),
      createMockExpense({ amount: 300 }),
    ];
    const incomes = [createMockIncome({ amount: 200 })];

    const result = calculateNetFlow(expenses, incomes);

    expect(result.totalExpenses).toBe(800);
    expect(result.totalIncome).toBe(200);
    expect(result.netFlow).toBe(-600);
  });

  it("should return zero net flow when income equals expenses", () => {
    const expenses = [createMockExpense({ amount: 500 })];
    const incomes = [createMockIncome({ amount: 500 })];

    const result = calculateNetFlow(expenses, incomes);

    expect(result.netFlow).toBe(0);
  });

  it("should handle empty arrays", () => {
    const result = calculateNetFlow([], []);

    expect(result.totalExpenses).toBe(0);
    expect(result.totalIncome).toBe(0);
    expect(result.netFlow).toBe(0);
  });
});

describe("transformToComparisonChartData", () => {
  it("should create monthly comparison data", () => {
    const now = new Date();
    const currentMonth = format(now, "yyyy-MM");

    const expenses = [
      createMockExpense({
        amount: 300,
        date: format(now, "yyyy-MM-dd"),
      }),
    ];
    const incomes = [
      createMockIncome({
        amount: 500,
        date: format(now, "yyyy-MM-dd"),
      }),
    ];

    const result = transformToComparisonChartData(expenses, incomes, 6);

    expect(result).toHaveLength(6);

    const currentMonthData = result.find((d) => d.month === currentMonth);
    expect(currentMonthData).toBeDefined();
    expect(currentMonthData?.expenses).toBe(300);
    expect(currentMonthData?.income).toBe(500);
    expect(currentMonthData?.netFlow).toBe(200);
  });

  it("should handle empty data", () => {
    const result = transformToComparisonChartData([], [], 6);

    expect(result).toHaveLength(6);
    result.forEach((monthData) => {
      expect(monthData.expenses).toBe(0);
      expect(monthData.income).toBe(0);
      expect(monthData.netFlow).toBe(0);
    });
  });

  it("should aggregate multiple entries per month", () => {
    const now = new Date();
    const currentMonth = format(now, "yyyy-MM");

    const expenses = [
      createMockExpense({ amount: 100, date: format(now, "yyyy-MM-dd") }),
      createMockExpense({ amount: 150, date: format(now, "yyyy-MM-dd") }),
    ];
    const incomes = [
      createMockIncome({ amount: 200, date: format(now, "yyyy-MM-dd") }),
      createMockIncome({ amount: 300, date: format(now, "yyyy-MM-dd") }),
    ];

    const result = transformToComparisonChartData(expenses, incomes, 6);
    const currentMonthData = result.find((d) => d.month === currentMonth);

    expect(currentMonthData?.expenses).toBe(250);
    expect(currentMonthData?.income).toBe(500);
    expect(currentMonthData?.netFlow).toBe(250);
  });

  it("should include month labels", () => {
    const result = transformToComparisonChartData([], [], 6);

    result.forEach((monthData) => {
      expect(monthData.monthLabel).toBeDefined();
      expect(monthData.monthLabel.length).toBeGreaterThan(0);
    });
  });
});

describe("calculateIncomeCategoryBreakdown", () => {
  it("should calculate category breakdown", () => {
    const incomes: IncomeWithCategory[] = [
      createMockIncome({
        amount: 3000,
        income_category_id: "salary",
        income_category: {
          id: "salary",
          name: "Salary",
          color: "#22c55e",
          account_id: "acc-1",
          icon: "briefcase",
          created_at: "",
        },
      }),
      createMockIncome({
        amount: 1000,
        income_category_id: "freelance",
        income_category: {
          id: "freelance",
          name: "Freelance",
          color: "#3b82f6",
          account_id: "acc-1",
          icon: "laptop",
          created_at: "",
        },
      }),
    ];

    const result = calculateIncomeCategoryBreakdown(incomes);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Salary");
    expect(result[0].value).toBe(3000);
    expect(result[0].percentage).toBe(75);
    expect(result[1].name).toBe("Freelance");
    expect(result[1].value).toBe(1000);
    expect(result[1].percentage).toBe(25);
  });

  it("should handle uncategorized income", () => {
    const incomes: IncomeWithCategory[] = [
      createMockIncome({
        amount: 500,
        income_category_id: null,
        income_category: null,
      }),
    ];

    const result = calculateIncomeCategoryBreakdown(incomes);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Uncategorized");
    expect(result[0].percentage).toBe(100);
  });

  it("should sort by value descending", () => {
    const incomes: IncomeWithCategory[] = [
      createMockIncome({
        amount: 100,
        income_category_id: "small",
        income_category: {
          id: "small",
          name: "Small",
          color: "#ccc",
          account_id: "acc-1",
          icon: "coin",
          created_at: "",
        },
      }),
      createMockIncome({
        amount: 1000,
        income_category_id: "big",
        income_category: {
          id: "big",
          name: "Big",
          color: "#000",
          account_id: "acc-1",
          icon: "banknote",
          created_at: "",
        },
      }),
    ];

    const result = calculateIncomeCategoryBreakdown(incomes);

    expect(result[0].name).toBe("Big");
    expect(result[1].name).toBe("Small");
  });

  it("should handle empty array", () => {
    const result = calculateIncomeCategoryBreakdown([]);
    expect(result).toHaveLength(0);
  });
});

describe("buildIncomeCategoryColorMap", () => {
  it("should build color map from categories", () => {
    const categories = [
      {
        id: "cat-1",
        name: "Salary",
        color: "#22c55e",
        account_id: "acc-1",
        icon: "briefcase",
        created_at: "",
      },
      {
        id: "cat-2",
        name: "Freelance",
        color: "#3b82f6",
        account_id: "acc-1",
        icon: "laptop",
        created_at: "",
      },
    ];

    const map = buildIncomeCategoryColorMap(categories);

    expect(map.get("cat-1")).toBe("#22c55e");
    expect(map.get("cat-2")).toBe("#3b82f6");
    expect(map.get("Salary")).toBe("#22c55e");
    expect(map.get("Freelance")).toBe("#3b82f6");
  });

  it("should include uncategorized with green default", () => {
    const map = buildIncomeCategoryColorMap([]);
    expect(map.get("Uncategorized")).toBe("#22c55e");
  });
});
