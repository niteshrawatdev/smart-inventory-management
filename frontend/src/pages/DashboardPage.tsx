import React, { useEffect, useState } from 'react';
import { 
  Package, 
  Warehouse, 
  AlertTriangle, 
  TrendingUp,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { warehouseApi } from '../api/warehouse';
import { inventoryApi } from '../api/inventory';
import { alertApi } from '../api/alert';
import { productApi } from '../api/product';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalWarehouses: 0,
    totalProducts: 0,
    lowStockItems: 0,
    activeAlerts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch warehouses
      const warehousesRes = await warehouseApi.getAll({ limit: 1 });
      const totalWarehouses = warehousesRes.pagination?.total || 0;

      // Fetch low stock items
      const lowStockRes = await inventoryApi.getLowStock();
      const lowStockItems = lowStockRes.data?.length || 0;

      // Fetch active alerts
      const alertsRes = await alertApi.getUnresolved();
      const activeAlerts = alertsRes.data?.length || 0;

      // For total products, you might need to fetch from products API
      const productsRes = await productApi.getAll({ limit: 1 });
      const totalProducts = productsRes.pagination?.total || 0;

      setStats({
        totalWarehouses,
        totalProducts,
        lowStockItems,
        activeAlerts,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Warehouses',
      value: stats.totalWarehouses,
      icon: Warehouse,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-green-500',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      trend: '+3%',
      trendUp: false,
    },
    {
      title: 'Active Alerts',
      value: stats.activeAlerts,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-5%',
      trendUp: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your warehouse operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className="mt-2 flex items-center text-sm">
                    {stat.trendUp ? (
                      <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={stat.trendUp ? 'text-green-600' : 'text-red-600'}>
                      {stat.trend}
                    </span>
                    <span className="text-gray-500 ml-2">from last month</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Warehouse Utilization */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Utilization</h3>
          <div className="space-y-4">
            {[80, 65, 45, 30].map((utilization, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Warehouse {index + 1}</span>
                  <span className="font-medium">{utilization}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${utilization > 75 ? 'bg-red-500' :
                        utilization > 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                      }`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'Stock added', item: 'Product A', time: '2 min ago' },
              { action: 'Alert resolved', item: 'Low stock warning', time: '15 min ago' },
              { action: 'Warehouse updated', item: 'Main Warehouse', time: '1 hour ago' },
              { action: 'New product added', item: 'Product B', time: '2 hours ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.item}</p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Add Product</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Warehouse className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Create Warehouse</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <AlertTriangle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">View Alerts</span>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <span className="text-sm font-medium text-gray-900">Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;