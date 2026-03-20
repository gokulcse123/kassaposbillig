import React from "react";
import "../dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard">

      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="logo">Dreams POS</h2>
        <ul>
          <li>Item Master</li>
          <li>Supplier</li>
          <li>Customer</li>
          <li>Purchase</li>
          <li>Billing POS</li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main">

        <h1 className="title">KASSA BM</h1>

        {/* Top Cards */}
        <div className="cards">

          <div className="card orange">
            <h2>16</h2>
            <p>Customers</p>
          </div>

          <div className="card teal">
            <h2>5</h2>
            <p>Suppliers</p>
          </div>

          <div className="card dark">
            <h2>22</h2>
            <p>Purchase Invoice</p>
          </div>

          <div className="card green">
            <h2>212</h2>
            <p>Sales Invoice</p>
          </div>

        </div>

        {/* Chart + Table */}
        <div className="bottom">

          <div className="chart">
            <h3>Weekly Sales</h3>
            <div className="bar"></div>
          </div>

          <div className="table">
            <h3>Top Products</h3>
            <table>
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
                  <td>Item A</td>
                  <td>10</td>
                  <td>500</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;