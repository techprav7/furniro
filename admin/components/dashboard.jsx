import React, { useEffect, useState } from 'react';
import { Box, H2, H3, Text, Icon, Badge, Button } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const api = new ApiClient();

const StatCard = ({ title, value, subtitle, icon, color, gradient }) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '20px 24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      flex: '1 1 240px',
      minWidth: '220px',
      margin: '8px',
      display: 'flex',
      alignItems: 'center',
      border: '1px solid #f0f0f5',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        backgroundColor: color || '#B88E2F'
      }} />
      <div style={{
        background: gradient || `${color}15`,
        borderRadius: '12px',
        padding: '14px',
        marginRight: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color || '#B88E2F',
        flexShrink: 0
      }}>
        <Icon icon={icon || 'Activity'} size={24} />
      </div>
      <div style={{ flex: 1 }}>
        <Text size="xs" color="grey60" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
          {title}
        </Text>
        <H3 style={{ margin: '4px 0 2px 0', fontWeight: 700, fontSize: '22px', color: '#1c1c3a' }}>
          {value}
        </H3>
        {subtitle && (
          <Text size="xs" color="grey60" style={{ margin: 0 }}>
            {subtitle}
          </Text>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then((response) => {
      if (response.data && response.data.stats) {
        setStats(response.data.stats);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Dashboard fetch error:", err);
      setLoading(false);
    });
  }, []);

  const formatSales = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#2ecc71';
      case 'dispatched': return '#3498db';
      case 'shipped': return '#9b59b6';
      case 'out_for_delivery': return '#e67e22';
      case 'delivered': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      case 'refunded': return '#95a5a6';
      default: return '#f1c40f';
    }
  };

  if (loading) {
    return (
      <Box variant="grey" style={{ padding: '40px', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: '18px', fontWeight: 500 }}>Loading Furniro Analytics...</Text>
      </Box>
    );
  }

  const s = stats || {
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalContacts: 0,
    lowStockCount: 0,
    totalCoupons: 0,
    totalBanners: 0,
    pendingReturnsCount: 0,
    statusCounts: {},
    topProducts: [],
    revenueTimeline: [],
    recentOrders: []
  };

  const maxTimelineRevenue = Math.max(...(s.revenueTimeline.map(t => t.revenue)), 1);

  return (
    <Box variant="grey" style={{ padding: '32px 40px', minHeight: '100vh', backgroundColor: '#f4f6fa', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ─── Header & Quick Actions ───────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <H2 style={{ fontWeight: 800, color: '#1c1c3a', margin: 0, fontSize: '28px' }}>
            Furniro Admin Central
          </H2>
          <Text color="grey60" style={{ marginTop: '4px', fontSize: '14px' }}>
            Real-time catalog, sales trends, and customer care metrics
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="/admin/resources/ReturnRequest" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" style={{ borderColor: '#d97706', color: '#d97706', borderRadius: '6px', fontWeight: 600, backgroundColor: '#fffbeb' }}>
              ⚠️ Requests & Refunds ({s.pendingReturnsCount || 0})
            </Button>
          </a>
          <a href="/admin/resources/Product/actions/new" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm" style={{ backgroundColor: '#B88E2F', borderColor: '#B88E2F', borderRadius: '6px', fontWeight: 600 }}>
              + Add Product
            </Button>
          </a>
          <a href="/admin/resources/Category/actions/new" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm" style={{ borderRadius: '6px', fontWeight: 600 }}>
              + Add Category
            </Button>
          </a>
          <a href="/admin/export/orders.csv" style={{ textDecoration: 'none' }}>
            <Button variant="light" size="sm" style={{ borderRadius: '6px', fontWeight: 600 }}>
              📥 Export Orders CSV
            </Button>
          </a>
        </div>
      </div>

      {/* ─── Urgent Action Banner: Pending Customer Requests & Refunds ─── */}
      {s.pendingReturnsCount > 0 && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '18px 24px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              backgroundColor: '#fef3c7',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0
            }}>
              <Icon icon="RotateCcw" size={22} />
            </div>
            <div>
              <Text style={{ fontWeight: 700, fontSize: '15px', color: '#92400e', margin: 0 }}>
                ⚠️ {s.pendingReturnsCount} Customer Request{s.pendingReturnsCount > 1 ? 's' : ''} Awaiting Review (Cancellations, Returns & Exchanges)
              </Text>
              <Text size="xs" style={{ color: '#b45309', margin: '2px 0 0 0' }}>
                Review and approve order cancellations, return inspections, or item replacements before refunds are initiated.
              </Text>
            </div>
          </div>
          <a href="/admin/resources/ReturnRequest" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="sm" style={{ backgroundColor: '#d97706', borderColor: '#d97706', color: '#fff', borderRadius: '6px', fontWeight: 700, padding: '8px 18px' }}>
              Review Requests & Refunds ({s.pendingReturnsCount}) →
            </Button>
          </a>
        </div>
      )}

      {/* ─── Top KPI Cards ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-8px', marginBottom: '24px' }}>
        <StatCard title="Total Revenue" value={formatSales(s.totalSales)} subtitle="Paid & Delivered Orders" icon="DollarSign" color="#2ecc71" />
        <StatCard title="Total Orders" value={s.totalOrders} subtitle="All Lifetime Orders" icon="ShoppingBag" color="#3498db" />
        <StatCard title="Customer Requests" value={s.pendingReturnsCount} subtitle={s.pendingReturnsCount > 0 ? "Awaiting Review & Refund" : "All Clear"} icon="RotateCcw" color="#d97706" />
        <StatCard title="Total Catalog" value={s.totalProducts} subtitle={`${s.lowStockCount} low in stock`} icon="Package" color="#B88E2F" />
        <StatCard title="Customers" value={s.totalUsers} subtitle="Registered Accounts" icon="Users" color="#9b59b6" />
        <StatCard title="Inquiries" value={s.totalContacts} subtitle="Contact Submissions" icon="Mail" color="#1abc9c" />
      </div>

      {/* ─── Main Grid: Charts & Top Sellers ─────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* 7-Day Revenue Trend */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #f0f0f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <Text style={{ fontWeight: 700, fontSize: '16px', color: '#1c1c3a' }}>Revenue Trend (Last 7 Days)</Text>
              <Text size="xs" color="grey60">Daily sales velocity in INR</Text>
            </div>
            <Badge variant="primary" style={{ backgroundColor: '#f0f0f5', color: '#1c1c3a', fontWeight: 600 }}>Daily</Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingTop: '20px', gap: '12px' }}>
            {s.revenueTimeline && s.revenueTimeline.map((item, idx) => {
              const heightPercent = Math.max(Math.round((item.revenue / maxTimelineRevenue) * 100), 8);
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <Text size="xs" style={{ fontSize: '10px', color: '#888', marginBottom: '4px', fontWeight: 600 }}>
                    {item.revenue > 0 ? `₹${(item.revenue / 1000).toFixed(0)}k` : '₹0'}
                  </Text>
                  <div
                    title={`${item.dayName} (${item.date}): ₹${item.revenue.toLocaleString()} (${item.orders} orders)`}
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPercent}%`,
                      backgroundColor: item.revenue > 0 ? '#B88E2F' : '#e0e0e0',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s ease',
                      cursor: 'pointer',
                    }}
                  />
                  <Text size="xs" style={{ marginTop: '8px', fontWeight: 600, color: '#555', fontSize: '11px' }}>
                    {item.dayName}
                  </Text>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Best-Selling Products */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #f0f0f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <Text style={{ fontWeight: 700, fontSize: '16px', color: '#1c1c3a' }}>Best-Selling Products</Text>
              <Text size="xs" color="grey60">Ranked by volume sold</Text>
            </div>
            <a href="/admin/resources/Product" style={{ textDecoration: 'none', fontSize: '12px', color: '#B88E2F', fontWeight: 600 }}>
              View All Products →
            </a>
          </div>

          {s.topProducts && s.topProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {s.topProducts.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f9f9fb', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#B88E2F' : '#e5e7eb',
                      color: idx === 0 ? '#fff' : '#4b5563',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '12px'
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <Text style={{ fontWeight: 600, fontSize: '13px', color: '#1c1c3a', margin: 0 }}>
                        {p._id || "Product"}
                      </Text>
                      <Text size="xs" color="grey60" style={{ margin: 0 }}>
                        {p.totalQty} units sold
                      </Text>
                    </div>
                  </div>
                  <Text style={{ fontWeight: 700, fontSize: '13px', color: '#2ecc71' }}>
                    {formatSales(p.totalRevenue)}
                  </Text>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#888' }}>
              <Icon icon="Package" size={32} />
              <Text style={{ marginTop: '8px' }}>No order item data yet.</Text>
            </div>
          )}
        </div>
      </div>

      {/* ─── Order Pipeline & Recent Orders ──────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Order Status Pipeline */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #f0f0f5' }}>
          <div style={{ marginBottom: '16px' }}>
            <Text style={{ fontWeight: 700, fontSize: '16px', color: '#1c1c3a' }}>Fulfillment Pipeline</Text>
            <Text size="xs" color="grey60">Current order state distribution</Text>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { label: 'Paid / To Dispatch', key: 'paid', color: '#2ecc71' },
              { label: 'Dispatched', key: 'dispatched', color: '#3498db' },
              { label: 'Shipped', key: 'shipped', color: '#9b59b6' },
              { label: 'Out for Delivery', key: 'out_for_delivery', color: '#e67e22' },
              { label: 'Delivered', key: 'delivered', color: '#27ae60' },
              { label: 'Cancelled / Refunded', key: 'cancelled', color: '#e74c3c' },
            ].map((st, idx) => (
              <div key={idx} style={{ padding: '12px 14px', borderRadius: '8px', borderLeft: `4px solid ${st.color}`, backgroundColor: '#fafbfc' }}>
                <Text size="xs" color="grey60" style={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  {st.label}
                </Text>
                <H3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 700, color: '#1c1c3a' }}>
                  {s.statusCounts[st.key] || 0}
                </H3>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders List */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #f0f0f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <Text style={{ fontWeight: 700, fontSize: '16px', color: '#1c1c3a' }}>Recent Orders</Text>
              <Text size="xs" color="grey60">Latest store transactions</Text>
            </div>
            <a href="/admin/resources/Order" style={{ textDecoration: 'none', fontSize: '12px', color: '#B88E2F', fontWeight: 600 }}>
              View All Orders →
            </a>
          </div>

          {s.recentOrders && s.recentOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {s.recentOrders.map((ord, idx) => {
                const customer = ord.shippingAddress ? `${ord.shippingAddress.firstName || ""} ${ord.shippingAddress.lastName || ""}`.trim() : "Guest";
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #f0f0f5' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a href={`/admin/resources/Order/records/${ord._id}/show`} style={{ fontWeight: 700, fontSize: '13px', color: '#1c1c3a', textDecoration: 'none' }}>
                          #{ord.razorpayOrderId || ord._id.slice(-6)}
                        </a>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: `${getStatusColor(ord.status)}20`,
                          color: getStatusColor(ord.status),
                          textTransform: 'uppercase'
                        }}>
                          {ord.status}
                        </span>
                      </div>
                      <Text size="xs" color="grey60" style={{ margin: '2px 0 0 0' }}>
                        {customer} • {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : ""}
                      </Text>
                    </div>
                    <Text style={{ fontWeight: 700, fontSize: '14px', color: '#1c1c3a' }}>
                      {formatSales(ord.totalAmount)}
                    </Text>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#888' }}>
              <Icon icon="ShoppingBag" size={32} />
              <Text style={{ marginTop: '8px' }}>No orders placed yet.</Text>
            </div>
          )}
        </div>

      </div>

    </Box>
  );
};

export default Dashboard;
