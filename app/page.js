'use client';

import { useEffect, useState } from 'react';
import AssetComparisonChart from '@/components/AssetComparisonChart';
import PerformanceChart from '@/components/PerformanceChart';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState(null);
  const [benchmarks, setBenchmarks] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    nextCycleTime: null,
    cyclesCompleted: 0,
    totalTradesExecuted: 0,
    averageTradesPerCycle: 0,
  });

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/fund-manager?section=history'),
      ]);

      const statusData = await statusRes.json();
      const historyData = await historyRes.json();

      if (statusData.success) {
        setPortfolio(statusData.portfolio);
        setBenchmarks(statusData.benchmarks);
        setPerformance(statusData.performance);
      }

      if (historyData.success) {
        const cycles = historyData.latest || [];
        setHistory(cycles);
        
        // Calculate stats
        const totalTrades = cycles.reduce((sum, c) => sum + (c.stats?.tradesExecuted || 0), 0);
        const avgTrades = cycles.length > 0 ? (totalTrades / cycles.length).toFixed(2) : 0;
        
        setStats({
          cyclesCompleted: cycles.length,
          totalTradesExecuted: totalTrades,
          averageTradesPerCycle: avgTrades,
        });
      }

      setMessage('');
    } catch (error) {
      setMessage('❌ Error loading data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const runFundManagerCycle = async () => {
    setMessage('🤖 Starting autonomous trading cycle...');
    setLoading(true);
    try {
      const res = await fetch('/api/trade', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setMessage('✅ Autonomous trading cycle completed successfully!');
        setTimeout(() => fetchStatus(), 1000);
      } else {
        setMessage('⚠️ Error: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <main>
      {/* Header */}
      <header>
        <div style={{ marginBottom: '24px' }}>
          <div className="badge badge-info">🤖 AUTONOMOUS FUND MANAGER</div>
          <h1 style={{ marginTop: '16px' }}>BAZ HOLDING GROUP</h1>
          <p>AI-powered autonomous trading targeting: IHSG | S&P 500 | Gold | Bitcoin | Top 100 Crypto | USD</p>
          <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>Trading Mode: Hourly autonomous cycles | Asset Selection: AI-driven | Risk Profile: Conservative (30% trading, 70% USDT)</p>
        </div>
      </header>

      {/* Key Metrics */}
      <section className="grid grid-4">
        <div className="metric-card card-highlight">
          <div className="metric-label">💰 Portfolio Value</div>
          <div className="metric-value">
            ${portfolio ? portfolio.totalUsd.toLocaleString('en-US', {maximumFractionDigits: 2}) : '0.00'}
          </div>
          <div className="metric-subtext">Assets Under Management</div>
        </div>
        <div className="metric-card card-highlight">
          <div className="metric-label">📈 Best Outperformance</div>
          <div className={`metric-value ${performance && Math.max(
            performance.comparison.vsIHSG,
            performance.comparison.vsSP500,
            performance.comparison.vsGold,
            performance.comparison.vsBTC,
            performance.comparison.vsTop100Crypto,
            performance.comparison.vsUSD
          ) > 0 ? 'positive' : 'negative'}`}>
            {performance ? '+' + Math.max(
              performance.comparison.vsIHSG,
              performance.comparison.vsSP500,
              performance.comparison.vsGold,
              performance.comparison.vsBTC,
              performance.comparison.vsTop100Crypto,
              performance.comparison.vsUSD
            ).toFixed(2) : '0'}%
          </div>
          <div className="metric-subtext">vs All Benchmarks</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">🎯 Holdings</div>
          <div className="metric-value">
            {portfolio ? Object.keys(portfolio.holdings).length : 0}
          </div>
          <div className="metric-subtext">Active Positions</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">🚀 Cycles Completed</div>
          <div className="metric-value" style={{ fontSize: '20px' }}>
            {stats.cyclesCompleted}
          </div>
          <div className="metric-subtext">{stats.totalTradesExecuted} trades executed</div>
        </div>
      </section>

      {/* Control Button */}
      <section style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={runFundManagerCycle}
          disabled={loading}
          className="primary"
          style={{ padding: '12px 24px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '⏳ Running...' : '🤖 Execute Trading Cycle Now'}
        </button>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="secondary"
          style={{ padding: '12px 24px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          🔄 Refresh Data
        </button>
      </section>

      {/* Message */}
      {message && (
        <section className="card" style={{
          borderColor: message.includes('✅') ? '#10b981' : message.includes('⚠️') ? '#f59e0b' : '#ef4444',
          background: message.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : message.includes('⚠️') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          marginBottom: '24px'
        }}>
          <p>{message}</p>
        </section>
      )}

      {/* Tabs */}
      <section style={{ marginBottom: '32px', display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
        {['overview', 'performance', 'history', 'info'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="secondary"
            style={{
              borderBottom: activeTab === tab ? '2px solid #60a5fa' : 'none',
              background: activeTab === tab ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
              paddingBottom: '12px',
              marginBottom: '-16px',
            }}
          >
            {tab === 'info' ? 'ℹ️ How It Works' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </section>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <section className="card">
            <h2>📊 Autonomous Trading Performance</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
              Portfolio performance vs target benchmarks (Real-time updated by AI trading)
            </p>
            {performance ? (
              <div className="grid grid-3">
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs IHSG</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsIHSG > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsIHSG > 0 ? '+' : ''}{performance.comparison.vsIHSG}%
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs S&P 500</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsSP500 > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsSP500 > 0 ? '+' : ''}{performance.comparison.vsSP500}%
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs Gold</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsGold > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsGold > 0 ? '+' : ''}{performance.comparison.vsGold}%
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs Bitcoin</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsBTC > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsBTC > 0 ? '+' : ''}{performance.comparison.vsBTC}%
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs Top 100 Crypto</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsTop100Crypto > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsTop100Crypto > 0 ? '+' : ''}{performance.comparison.vsTop100Crypto}%
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs USD</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsUSD > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsUSD > 0 ? '+' : ''}{performance.comparison.vsUSD}%
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading performance data...</p>
            )}
          </section>

          <section className="card">
            <h2>💼 Current Holdings (AI-Selected)</h2>
            {portfolio && Object.keys(portfolio.holdings).length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#9ca3af' }}>Asset</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#9ca3af' }}>Quantity</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#9ca3af' }}>Price (USD)</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#9ca3af' }}>Value (USD)</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#9ca3af' }}>Portfolio %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(portfolio.holdings).map(([symbol, holding]) => (
                      <tr key={symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{symbol}</td>
                        <td style={{ textAlign: 'right', padding: '12px' }}>{holding.quantity.toFixed(4)}</td>
                        <td style={{ textAlign: 'right', padding: '12px' }}>${holding.price.toFixed(4)}</td>
                        <td style={{ textAlign: 'right', padding: '12px' }}>${holding.value.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '12px', color: '#60a5fa', fontWeight: '600' }}>{holding.percentOfPortfolio}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No holdings yet. Fund your Binance account with USDT to begin autonomous trading.</p>
            )}
          </section>
        </>
      )}
          <div className="metric-value">
            {portfolio ? Object.keys(portfolio.holdings).length : 0}
          </div>
          <div className="metric-subtext">Active Positions</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">🚀 Status</div>
          <div className="metric-value" style={{ fontSize: '18px', color: '#10b981' }}>
            {loading ? '⏳ Sync' : '✅ Live'}
          </div>
          <div className="metric-subtext">System Active</div>
        </div>
      </section>

      {/* Control Button */}
      <section style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={runFundManagerCycle}
          disabled={loading}
          className="primary"
          style={{ padding: '12px 24px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '⏳ Running...' : '🤖 Execute Fund Manager Cycle'}
        </button>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="secondary"
          style={{ padding: '12px 24px', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          🔄 Refresh
        </button>
      </section>

      {/* Message */}
      {message && (
        <section className="card" style={{
          borderColor: message.includes('✅') ? '#10b981' : message.includes('⚠️') ? '#f59e0b' : '#ef4444',
          background: message.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : message.includes('⚠️') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          marginBottom: '24px'
        }}>
          <p>{message}</p>
        </section>
      )}

      {/* Tabs */}
      <section style={{ marginBottom: '32px', display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
        {['overview', 'performance', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="secondary"
            style={{
              borderBottom: activeTab === tab ? '2px solid #60a5fa' : 'none',
              background: activeTab === tab ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
              paddingBottom: '12px',
              marginBottom: '-16px',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </section>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <section className="card">
            <h2>📊 Benchmark Comparison</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
              Portfolio performance vs target benchmarks
            </p>
            {performance ? (
              <div className="grid grid-3">
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs IHSG</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsIHSG > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsIHSG > 0 ? '+' : ''}{performance.comparison.vsIHSG}%
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs S&P 500</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsSP500 > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsSP500 > 0 ? '+' : ''}{performance.comparison.vsSP500}%
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs Gold</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsGold > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsGold > 0 ? '+' : ''}{performance.comparison.vsGold}%
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs Bitcoin</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsBTC > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsBTC > 0 ? '+' : ''}{performance.comparison.vsBTC}%
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs Top 100 Crypto</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsTop100Crypto > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsTop100Crypto > 0 ? '+' : ''}{performance.comparison.vsTop100Crypto}%
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>vs USD</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: performance.comparison.vsUSD > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
                    {performance.comparison.vsUSD > 0 ? '+' : ''}{performance.comparison.vsUSD}%
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading performance data...</p>
            )}
          </section>

          <section className="card">
            <h2>💼 Current Holdings</h2>
            {portfolio && Object.keys(portfolio.holdings).length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ textAlign: 'left', padding: '12px', color: '#9ca3af' }}>Asset</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#9ca3af' }}>Quantity</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#9ca3af' }}>Price</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#9ca3af' }}>Value</th>
                      <th style={{ textAlign: 'right', padding: '12px', color: '#9ca3af' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(portfolio.holdings).map(([symbol, holding]) => (
                      <tr key={symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{symbol}</td>
                        <td style={{ textAlign: 'right', padding: '12px' }}>{holding.quantity.toFixed(4)}</td>
                        <td style={{ textAlign: 'right', padding: '12px' }}>${holding.price.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '12px' }}>${holding.value.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '12px', color: '#60a5fa' }}>{holding.percentOfPortfolio}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No holdings yet. Fund the account with USDT to begin.</p>
            )}
          </section>
        </>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <>
          <section className="card">
            <h2>📈 Benchmark Indices (Live)</h2>
            {benchmarks ? (
              <div className="grid grid-2">
                <div>
                  <h3>Global Benchmarks</h3>
                  <div style={{ marginTop: '16px' }}>
                    {Object.entries(benchmarks).map(([key, bench]) => (
                      <div key={key} className="card" style={{ marginBottom: '12px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{bench.name}</div>
                            <div style={{ fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>
                              ${typeof bench.currentPrice === 'number' ? bench.currentPrice.toFixed(2) : bench.currentPrice}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '14px', color: bench.change24h > 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                              {bench.change24h > 0 ? '+' : ''}{bench.change24h?.toFixed(2) || 0}%
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>24h Change</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>Your Fund Performance</h3>
                  <div style={{ marginTop: '16px' }}>
                    <div className="card" style={{ padding: '16px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>Current Value</div>
                      <div style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '8px', color: '#60a5fa' }}>
                        ${portfolio ? portfolio.totalUsd.toLocaleString('en-US', {maximumFractionDigits: 2}) : '0'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                        {portfolio ? Object.keys(portfolio.holdings).length : 0} assets | {stats.cyclesCompleted} cycles
                      </div>
                    </div>
                    <div className="card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>Average Trades/Cycle</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px', color: '#10b981' }}>
                        {stats.averageTradesPerCycle}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p>Loading benchmark data...</p>
            )}
          </section>
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <section className="card">
          <h2>⏰ Recent Trading Cycles</h2>
          <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
            Last {history.length} autonomous trading cycles
          </p>
          {history.length > 0 ? (
            <div style={{ overflowY: 'auto', maxHeight: '600px' }}>
              {history.map((cycle, idx) => (
                <div key={idx} className="card" style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '600' }}>Trading Cycle #{history.length - idx}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(cycle.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '13px', marginTop: '12px' }}>
                    <div>
                      <div style={{ color: '#9ca3af' }}>Portfolio Value</div>
                      <div style={{ fontWeight: '600', marginTop: '4px', color: '#60a5fa' }}>${cycle.portfolio.totalUsd.toLocaleString('en-US', {maximumFractionDigits: 2})}</div>
                    </div>
                    <div>
                      <div style={{ color: '#9ca3af' }}>Trades Executed</div>
                      <div style={{ fontWeight: '600', marginTop: '4px', color: cycle.stats?.tradesExecuted > 0 ? '#10b981' : '#6b7280' }}>
                        {cycle.stats?.tradesExecuted || 0}/{cycle.stats?.totalTrades || 0}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#9ca3af' }}>AI Engine</div>
                      <div style={{ fontWeight: '600', marginTop: '4px', color: '#f59e0b' }}>
                        {cycle.aiRecommendation?.source || 'unknown'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#9ca3af' }}>Duration</div>
                      <div style={{ fontWeight: '600', marginTop: '4px' }}>
                        {(cycle.duration / 1000).toFixed(1)}s
                      </div>
                    </div>
                  </div>
                  {cycle.stats?.tradesExecuted > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <div style={{ color: '#9ca3af' }}>Total Bought</div>
                        <div style={{ fontWeight: '600', marginTop: '4px', color: '#10b981' }}>${cycle.stats?.totalBought?.toFixed(2) || 0}</div>
                      </div>
                      <div>
                        <div style={{ color: '#9ca3af' }}>Total Sold</div>
                        <div style={{ fontWeight: '600', marginTop: '4px', color: '#ef4444' }}>${cycle.stats?.totalSold?.toFixed(2) || 0}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No trading cycles yet. Run autonomous cycles to generate history.</p>
          )}
        </section>
      )}

      {/* How It Works Tab */}
      {activeTab === 'info' && (
        <>
          <section className="card">
            <h2>🤖 Autonomous Trading System</h2>
            <div style={{ marginTop: '16px', lineHeight: '1.8' }}>
              <h3 style={{ marginTop: '16px', marginBottom: '8px' }}>How It Works</h3>
              <ul style={{ paddingLeft: '20px', color: '#d1d5db' }}>
                <li><strong>Your Role:</strong> Fund account with USDT on Binance</li>
                <li><strong>AI's Role:</strong> Automatically selects and trades assets to beat benchmarks</li>
                <li><strong>Frequency:</strong> Hourly autonomous trading cycles</li>
                <li><strong>Strategy:</strong> Conservative (30% trading, 70% USDT reserve)</li>
              </ul>

              <h3 style={{ marginTop: '24px', marginBottom: '8px' }}>Target Benchmarks</h3>
              <ul style={{ paddingLeft: '20px', color: '#d1d5db' }}>
                <li>IHSG (Indonesian Stock Index)</li>
                <li>S&P 500 (US Stock Index)</li>
                <li>Gold (XAUUSD)</li>
                <li>Bitcoin</li>
                <li>Top 100 Crypto Index</li>
                <li>USD/IDR Parity</li>
              </ul>

              <h3 style={{ marginTop: '24px', marginBottom: '8px' }}>Trading Decision Process</h3>
              <ol style={{ paddingLeft: '20px', color: '#d1d5db' }}>
                <li><strong>Discovery:</strong> AI scans top 50 crypto assets on Binance</li>
                <li><strong>Screening:</strong> Filters assets beating benchmark performance</li>
                <li><strong>Analysis:</strong> AI evaluates risk-reward and liquidity</li>
                <li><strong>Execution:</strong> Buys/sells with HIGH or MEDIUM conviction only</li>
                <li><strong>Monitoring:</strong> Tracks performance vs all benchmarks</li>
              </ol>

              <h3 style={{ marginTop: '24px', marginBottom: '8px' }}>Risk Management</h3>
              <ul style={{ paddingLeft: '20px', color: '#d1d5db' }}>
                <li>Max 30% per asset allocation</li>
                <li>Minimum USDT reserve maintained for opportunities</li>
                <li>Only executes HIGH/MEDIUM conviction trades</li>
                <li>Hourly rebalancing based on benchmark performance</li>
              </ul>

              <h3 style={{ marginTop: '24px', marginBottom: '8px' }}>Data & History</h3>
              <ul style={{ paddingLeft: '20px', color: '#d1d5db' }}>
                <li>Last 500 trading cycles stored automatically</li>
                <li>Real-time benchmark tracking</li>
                <li>Trade-by-trade execution logs</li>
                <li>Performance vs benchmarks calculated automatically</li>
              </ul>
            </div>
          </section>

          <section className="card">
            <h2>📋 Getting Started</h2>
            <div style={{ marginTop: '16px', color: '#d1d5db', lineHeight: '1.8' }}>
              <p><strong>Step 1:</strong> Create/verify Binance account</p>
              <p><strong>Step 2:</strong> Generate Binance API keys (trade + read permissions)</p>
              <p><strong>Step 3:</strong> Set environment variables:</p>
              <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', overflow: 'auto', marginTop: '8px', fontSize: '12px' }}>
{`BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret
OPENAI_API_KEY=your_openai_key
OPENCLAW_CLI_PATH=npx
ENGINE=openclaw`}
              </pre>
              <p style={{ marginTop: '16px' }}><strong>Step 4:</strong> Start worker: <code style={{ background: 'rgba(96,165,250,0.2)', padding: '2px 6px', borderRadius: '4px' }}>npm run worker</code></p>
              <p><strong>Step 5:</strong> Fund Binance account with USDT</p>
              <p><strong>Step 6:</strong> Watch as AI autonomously trades to beat benchmarks!</p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
