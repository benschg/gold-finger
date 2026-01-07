import { NextResponse } from "next/server";

const FRANKFURTER_API = "https://api.frankfurter.app";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const period = searchParams.get("period") || "1M"; // 1W, 1M, 1Y, 5Y

  if (!from || !to) {
    return NextResponse.json(
      { error: "Both 'from' and 'to' currency codes are required" },
      { status: 400 },
    );
  }

  // Calculate date range based on period
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case "1W":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "1M":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "1Y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case "5Y":
      startDate.setFullYear(startDate.getFullYear() - 5);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  try {
    const response = await fetch(
      `${FRANKFURTER_API}/${formatDate(startDate)}..${formatDate(endDate)}?from=${from}&to=${to}`,
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch historical rates" },
        { status: 503 },
      );
    }

    const data = await response.json();

    // Transform to array format for charting
    const rates = Object.entries(
      data.rates as Record<string, Record<string, number>>,
    ).map(([date, rateObj]) => ({
      date,
      rate: rateObj[to],
    }));

    // Calculate statistics
    const rateValues = rates.map((r) => r.rate);
    const min = Math.min(...rateValues);
    const max = Math.max(...rateValues);
    const avg = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;
    const current = rateValues[rateValues.length - 1];
    const change = ((current - rateValues[0]) / rateValues[0]) * 100;

    return NextResponse.json({
      from: data.base,
      to,
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      rates,
      stats: {
        min,
        max,
        avg,
        current,
        change,
      },
    });
  } catch (error) {
    console.error("Error fetching historical rates:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical rates" },
      { status: 503 },
    );
  }
}
