import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import { CATEGORIES, CATEGORY_COLORS } from "../utils/categories.js";
import { formatMonth, todayInTokyo, toMonthKey } from "../utils/date.js";
import { formatYen, listMonths, sumByCategory, sumByMonth } from "../utils/summary.js";

// 使用する Chart.js の部品を登録する
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ALL = "all";
const TEXT_SECONDARY = "#52514e";
const GRID_COLOR = "#e6e5e0";
const BAR_COLOR = "#2a78d6";

/**
 * カテゴリ別の円グラフと月別の棒グラフ
 * @param {{ receipts: object[] }} props
 */
export default function Charts({ receipts }) {
  const months = listMonths(receipts);
  // 初期表示は今月(データがなければ全期間)
  const thisMonth = toMonthKey(todayInTokyo());
  const [selected, setSelected] = useState(months.includes(thisMonth) ? thisMonth : ALL);
  const month = selected === ALL || !months.includes(selected) ? null : selected;

  const categoryTotals = sumByCategory(receipts, month);
  // 金額が 0 以下のカテゴリは円グラフに出さない
  const visibleCategories = CATEGORIES.filter((c) => categoryTotals[c] > 0);
  const categorySum = visibleCategories.reduce((sum, c) => sum + categoryTotals[c], 0);
  const monthly = sumByMonth(receipts);

  if (receipts.length === 0) return null;

  const pieData = {
    labels: visibleCategories,
    datasets: [
      {
        data: visibleCategories.map((c) => categoryTotals[c]),
        // 色はカテゴリに固定で紐づける(表示件数が変わっても色が変わらないように)
        backgroundColor: visibleCategories.map((c) => CATEGORY_COLORS[c]),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: { position: "bottom", labels: { color: TEXT_SECONDARY, boxWidth: 12 } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${formatYen(ctx.parsed)}(${Math.round((ctx.parsed / categorySum) * 100)}%)`,
        },
      },
    },
  };

  const barData = {
    labels: monthly.map((m) => formatMonth(m.month)),
    datasets: [
      {
        label: "支出合計",
        data: monthly.map((m) => m.total),
        backgroundColor: BAR_COLOR,
        borderRadius: 4,
        maxBarThickness: 48,
      },
    ],
  };

  const barOptions = {
    plugins: {
      // 系列が1つなので凡例は出さない(見出しで内容を示す)
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${formatYen(ctx.parsed.y)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: TEXT_SECONDARY } },
      y: {
        beginAtZero: true,
        grid: { color: GRID_COLOR },
        border: { display: false },
        ticks: { color: TEXT_SECONDARY, callback: (v) => formatYen(v) },
      },
    },
  };

  return (
    <div className="charts">
      <section className="card">
        <div className="card-header">
          <h2>カテゴリ別の支出</h2>
          <select value={month ?? ALL} onChange={(e) => setSelected(e.target.value)} aria-label="集計する月">
            <option value={ALL}>全期間</option>
            {[...months].reverse().map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </div>
        {visibleCategories.length === 0 ? (
          <p className="muted">この期間の支出はありません。</p>
        ) : (
          <>
            <div className="chart-box">
              <Pie data={pieData} options={pieOptions} />
            </div>
            {/* グラフと同じ内容を表でも確認できるようにする */}
            <table className="table compact">
              <tbody>
                {visibleCategories.map((c) => (
                  <tr key={c}>
                    <td>
                      <span className="swatch" style={{ background: CATEGORY_COLORS[c] }} />
                      {c}
                    </td>
                    <td className="num">{formatYen(categoryTotals[c])}</td>
                  </tr>
                ))}
                <tr className="sum-row">
                  <td>合計</td>
                  <td className="num">{formatYen(categorySum)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className="card">
        <h2>月別の支出合計</h2>
        <div className="chart-box">
          <Bar data={barData} options={barOptions} />
        </div>
      </section>
    </div>
  );
}
