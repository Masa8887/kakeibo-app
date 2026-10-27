import { describe, expect, it } from "vitest";
import { isValidDateString, todayInTokyo } from "./date.js";
import { flattenItems, listMonths, sumByCategory, sumByMonth } from "./summary.js";

const receipts = [
  {
    id: "r1",
    store: "スーパーA",
    date: "2026-09-30",
    items: [
      { id: "i1", name: "牛乳", amount: 198, category: "食費" },
      { id: "i2", name: "洗剤", amount: 348, category: "日用品" },
    ],
  },
  {
    id: "r2",
    store: "定食屋B",
    date: "2026-10-01",
    items: [
      { id: "i3", name: "日替わり定食", amount: 850, category: "外食" },
      { id: "i4", name: "割引", amount: -50, category: "外食" },
    ],
  },
];

describe("集計", () => {
  it("全期間のカテゴリ別合計を計算できる", () => {
    const totals = sumByCategory(receipts);
    expect(totals.食費).toBe(198);
    expect(totals.日用品).toBe(348);
    expect(totals.外食).toBe(800);
    expect(totals.交通費).toBe(0);
  });

  it("月を指定してカテゴリ別合計を計算できる", () => {
    const totals = sumByCategory(receipts, "2026-10");
    expect(totals.食費).toBe(0);
    expect(totals.外食).toBe(800);
  });

  it("未知のカテゴリは「その他」に集計される", () => {
    const totals = sumByCategory([{ id: "x", date: "2026-10-01", items: [{ amount: 100, category: "謎" }] }]);
    expect(totals.その他).toBe(100);
  });

  it("月別合計を古い順に返す", () => {
    expect(sumByMonth(receipts)).toEqual([
      { month: "2026-09", total: 546 },
      { month: "2026-10", total: 800 },
    ]);
    expect(listMonths(receipts)).toEqual(["2026-09", "2026-10"]);
  });

  it("明細を新しい日付順に平坦化する", () => {
    const items = flattenItems(receipts);
    expect(items).toHaveLength(4);
    expect(items[0]).toMatchObject({ store: "定食屋B", date: "2026-10-01" });
  });
});

describe("日付", () => {
  it("日本時間で日付を求める(UTC 15時は翌日)", () => {
    expect(todayInTokyo(new Date("2026-10-27T15:30:00Z"))).toBe("2026-10-28");
  });

  it("YYYY-MM-DD の妥当性を判定する", () => {
    expect(isValidDateString("2026-02-28")).toBe(true);
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("")).toBe(false);
  });
});
