import React, { useEffect, useState } from 'react';
import { Box, H2, H3, Text, Icon } from '@adminjs/design-system';
import { ApiClient } from 'adminjs';

const api = new ApiClient();

const Card = ({ title, value, icon, color }) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      flex: '1 1 250px',
      margin: '12px',
      display: 'flex',
      alignItems: 'center',
      borderLeft: `5px solid ${color || '#705df5'}`
    }}>
      <div style={{
        backgroundColor: `${color}15` || '#705df515',
        borderRadius: '50%',
        padding: '12px',
        marginRight: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color || '#705df5'
      }}>
        <Icon icon={icon || 'Activity'} size={24} />
      </div>
      <div>
        <Text size="sm" color="grey60" style={{ margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>
          {title}
        </Text>
        <H3 style={{ margin: '4px 0 0 0', fontWeight: 700, fontSize: '24px', color: '#1c1c3a' }}>
          {value}
        </H3>
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
      console.error(err);
      setLoading(false);
    });
  }, []);

  const formatSales = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  if (loading) {
    return (
      <Box variant="grey" style={{ padding: '40px', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading Dashboard Stats...</Text>
      </Box>
    );
  }

  const s = stats || { totalSales: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0, totalContacts: 0 };

  return (
    <Box variant="grey" style={{ padding: '40px', minHeight: '100vh', backgroundColor: '#f4f6fa' }}>
      <Box style={{ marginBottom: '24px' }}>
        <H2 style={{ fontWeight: 700, color: '#1c1c3a', margin: 0 }}>Furniro Dashboard</H2>
        <Text color="grey60">Real-time store metrics and overview</Text>
      </Box>

      <div style={{ display: 'flex', flexWrap: 'wrap', margin: '-12px' }}>
        <Card title="Total Revenue" value={formatSales(s.totalSales)} icon="DollarSign" color="#2ecc71" />
        <Card title="Total Orders" value={s.totalOrders} icon="ShoppingBag" color="#3498db" />
        <Card title="Total Products" value={s.totalProducts} icon="Package" color="#9b59b6" />
        <Card title="Contact Submissions" value={s.totalContacts} icon="MessageSquare" color="#e74c3c" />
        <Card title="Registered Customers" value={s.totalUsers} icon="Users" color="#1abc9c" />
      </div>
    </Box>
  );
};

export default Dashboard;
