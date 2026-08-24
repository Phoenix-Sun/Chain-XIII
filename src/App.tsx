import { useEffect, useRef } from "react";
import * as d3 from "d3";
import P0BattleLab from "./features/p0/P0BattleLab";

const progress = [
  { label: "P0 規則核心", value: 15 },
  { label: "P1 花色模板", value: 0 },
  { label: "P2 基因鍊成", value: 0 },
  { label: "P3 可玩戰鬥", value: 0 },
];

function ProgressChart() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const width = 620;
    const height = 220;
    const margin = { top: 16, right: 20, bottom: 44, left: 150 };
    const x = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
    const y = d3.scaleBand().domain(progress.map((item) => item.label)).range([margin.top, height - margin.bottom]).padding(0.28);

    svg.attr("viewBox", `0 0 ${width} ${height}`);
    svg.append("g").attr("class", "chart-grid").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(5).tickFormat((value) => `${value}%`));
    svg.append("g").attr("class", "chart-labels").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(y).tickSize(0));
    svg.selectAll(".bar").data(progress).join("rect").attr("class", "bar").attr("x", margin.left).attr("y", (item) => y(item.label) ?? 0).attr("width", (item) => x(item.value) - margin.left).attr("height", y.bandwidth()).attr("rx", 6);
    svg.selectAll(".value").data(progress).join("text").attr("class", "chart-value").attr("x", (item) => x(item.value) + 10).attr("y", (item) => (y(item.label) ?? 0) + y.bandwidth() / 2 + 5).text((item) => `${item.value}%`);
  }, []);

  return <svg ref={ref} role="img" aria-label="Prototype 開發進度圖" />;
}

export default function App() {
  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">CHAIN XIII · V3 花色鍊成版</p>
          <h1>先規劃，再遇到隨機，最後用十三支驗證 Build。</h1>
          <p className="lede">手機優先的 P0 垂直切片：用固定 seed 抽牌，點選並排出一副合法的 3 / 5 / 5 十三支。</p>
        </div>
        <span className="badge">P0 開發中</span>
      </header>

      <section className="grid">
        <article className="card feature-card">
          <span className="card-kicker">目前狀態</span>
          <h2>P0 規則核心</h2>
          <p>先驗證 52 張牌、抽 13、十三支合法性與牌型比較，再往花色模板與基因鍊成擴張。</p>
          <a href="https://github.com/Phoenix-Sun/Chain-XIII/blob/main/MVP%E9%96%8B%E7%99%BC%E6%96%87%E4%BB%B6_v0.1.md" className="text-link" target="_blank" rel="noreferrer">查看企劃基線 →</a>
        </article>
        <article className="card feature-card dark-card">
          <span className="card-kicker">Cloudflare</span>
          <h2>Worker + D1</h2>
          <p>部署後可用 <code>/api/health</code> 驗證 Worker 與 `save_slots`；SPA 其他路由由 static assets 接手。</p>
          <code className="endpoint">GET /api/health</code>
        </article>
      </section>

      <P0BattleLab />

      <section className="card chart-card">
        <div className="section-heading">
          <div><span className="card-kicker">D3.js prototype</span><h2>垂直切片進度</h2></div>
          <span className="muted">資料驅動，之後可替換為 Run telemetry</span>
        </div>
        <ProgressChart />
      </section>

      <footer>Mobile-first · Seed 可重現 · P0 rule tests · IndexedDB 預留 · D1 migration 已建立</footer>
    </main>
  );
}
