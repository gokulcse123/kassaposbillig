import React from "react";
import "../dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard">

      <div className="main">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-title">KASSA BM</div>
          <div className="topbar-right">
            <button className="topbar-icon-btn">⛶</button>
            <button className="topbar-icon-btn">⌂</button>
            <div className="topbar-user">
              <div className="user-avatar">A</div>
              <div className="user-info">
                <div className="user-name">8754031480</div>
                <div className="user-role">Admin</div>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">

          {/* Sale Summary */}
          <div className="sale-summary">
            <div className="sale-card">
              <div className="sale-icon blue">🛍️</div>
              <div className="sale-info">
                <div className="sale-value">0</div>
                <div className="sale-label">Today Sale</div>
              </div>
            </div>

            <div className="sale-card">
              <div className="sale-icon teal">📷</div>
              <div className="sale-info">
                <div className="sale-value">0</div>
                <div className="sale-label">Yesterday Sale</div>
              </div>
            </div>

            <div className="sale-card">
              <div className="sale-icon orange">⬇</div>
              <div className="sale-info">
                <div className="sale-value">0</div>
                <div className="sale-label">Weekly Sale</div>
              </div>
            </div>

            <div className="sale-card">
              <div className="sale-icon green">⬆</div>
              <div className="sale-info">
                <div className="sale-value">13782</div>
                <div className="sale-label">Monthly Sale</div>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="stat-cards">
            <div className="stat-card orange">
              <div className="stat-left">
                <div className="stat-number">16</div>
                <div className="stat-label">Customers</div>
              </div>
              <div className="stat-icon-wrap">👥</div>
            </div>

            <div className="stat-card teal">
              <div className="stat-left">
                <div className="stat-number">5</div>
                <div className="stat-label">Suppliers</div>
              </div>
              <div className="stat-icon-wrap">✔️</div>
            </div>

            <div className="stat-card dark-blue">
              <div className="stat-left">
                <div className="stat-number">22</div>
                <div className="stat-label">Purchase Invoice</div>
              </div>
              <div className="stat-icon-wrap">📋</div>
            </div>

            <div className="stat-card green">
              <div className="stat-left">
                <div className="stat-number">212</div>
                <div className="stat-label">Sales Invoice</div>
              </div>
              <div className="stat-icon-wrap">📄</div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="bottom-section">

            {/* Chart */}
            <div className="chart-panel">
              <div className="panel-header">
                <div className="panel-title">Weekly Sales</div>
              </div>

              <div className="chart-area">
                <div className="chart-bar-group"><div className="chart-bar bar-mon"></div><span>Mon</span></div>
                <div className="chart-bar-group"><div className="chart-bar bar-tue"></div><span>Tue</span></div>
                <div className="chart-bar-group"><div className="chart-bar bar-wed"></div><span>Wed</span></div>
                <div className="chart-bar-group"><div className="chart-bar bar-thu"></div><span>Thu</span></div>
                <div className="chart-bar-group"><div className="chart-bar bar-fri"></div><span>Fri</span></div>
                <div className="chart-bar-group"><div className="chart-bar bar-sat"></div><span>Sat</span></div>
                <div className="chart-bar-group"><div className="chart-bar bar-sun"></div><span>Sun</span></div>
              </div>
            </div>

            {/* Table */}
            <div className="table-panel">
              <div className="panel-header">
                <div className="panel-title">Top Products</div>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sno</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td className="product-name">Item A</td>
                    <td><span className="qty-badge">10</span></td>
                    <td className="amount-val">500</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;