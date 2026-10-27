import { describe, expect, it } from "vitest";
import { findDuplicateReceipt, findNegativeItems } from "./validation.js";

const existing = [
  {
    id: "r1",
    date: "2026-10-01",
    time: "12:30",
    items: [
      { id: "i1", name: "弁当", amount: 500, category: "食費" },
      { id: "i2", name: "お茶", amount: 150, category: "食費" },
    ],
  },
  {
    id: "r2",
    date: "2026-10-02",
    time: "",
    items: [{ id: "i3", name: "洗剤", amount: 300, category: "日用品" }],
  },
];

describe("負の金額の検出", () => {
  it("負の金額の明細だけを返す", () => {
    const items = [
      { name: "牛乳", amount: 198 },
      { name: "値引き", amount: -20 },
      { name: "無料サンプル", amount: 0 },
    ];
    expect(findNegativeItems(items).map((i) => i.name)).toEqual(["値引き"]);
  });
});

describe("重複レシートの検出", () => {
  it("日付・時刻・合計金額が同じなら重複とする", () => {
    const target = { date: "2026-10-01", time: "12:30", items: [{ amount: 650 }] };
    expect(findDuplicateReceipt(existing, target)?.id).toBe("r1");
  });

  it("時刻が異なれば重複としない", () => {
    const target = { date: "2026-10-01", time: "18:00", items: [{ amount: 650 }] };
    expect(findDuplicateReceipt(existing, target)).toBeNull();
  });

  it("合計金額が異なれば重複としない", () => {
    const target = { date: "2026-10-01", time: "12:30", items: [{ amount: 651 }] };
    expect(findDuplicateReceipt(existing, target)).toBeNull();
  });

  it("日付が異なれば重複としない", () => {
    const target = { date: "2026-10-03", time: "12:30", items: [{ amount: 650 }] };
    expect(findDuplicateReceipt(existing, target)).toBeNull();
  });

  it("どちらかの時刻が不明なら日付と合計金額で判定する", () => {
    expect(findDuplicateReceipt(existing, { date: "2026-10-01", time: "", items: [{ amount: 650 }] })?.id).toBe("r1");
    expect(findDuplicateReceipt(existing, { date: "2026-10-02", time: "09:00", items: [{ amount: 300 }] })?.id).toBe(
      "r2",
    );
  });
});
