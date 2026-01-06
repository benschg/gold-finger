import { NextResponse } from "next/server";
import { getExchangeRate, convertAmount } from "@/lib/exchange-rates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const amountStr = searchParams.get("amount");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Both 'from' and 'to' currency codes are required" },
      { status: 400 }
    );
  }

  // Validate currency codes (3 uppercase letters)
  const currencyRegex = /^[A-Z]{3}$/;
  if (!currencyRegex.test(from) || !currencyRegex.test(to)) {
    return NextResponse.json(
      { error: "Currency codes must be 3 uppercase letters (e.g., USD, EUR)" },
      { status: 400 }
    );
  }

  const result = await getExchangeRate(from, to);

  if (!result) {
    return NextResponse.json(
      { error: "Failed to fetch exchange rate" },
      { status: 503 }
    );
  }

  // If amount provided, include converted amount
  let convertedAmount: number | null = null;
  if (amountStr) {
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount >= 0) {
      convertedAmount = convertAmount(amount, result.rate);
    }
  }

  return NextResponse.json({
    from: result.fromCurrency,
    to: result.toCurrency,
    rate: result.rate,
    date: result.date,
    ...(convertedAmount !== null && { convertedAmount }),
  });
}
