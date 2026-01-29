// src/pages/WarehousesPage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical,
  MapPin,
  Building
} from 'lucide-react';
import { warehouseApi } from '../api/warehouse';
import { Warehouse } from '../types';

const WarehousesPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadWarehouses();
  }, [currentPage, searchTerm]);

  const loadWarehouses = async () => {
    try {
      setIsLoading(true);
      const response = await warehouseApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
      });
      
      if (response.success && response.data) {
        setWarehouses(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this warehouse?')) {
      try {
        await warehouseApi.delete(id);
        loadWarehouses();
      } catch (error) {
        console.error('Failed to delete warehouse:', error);
      }
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-gray-600">Manage your warehouse locations</p>
        </div>
        <Link
          to="/warehouses/new"
          className="inline-flex items-center btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Warehouse
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search warehouses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((warehouse) => (
          <div key={warehouse.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{warehouse.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {warehouse.location || 'No location specified'}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="font-medium">{warehouse.capacity || 'N/A'} units</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Utilization</p>
                  <p className="font-medium">{warehouse.currentUtilization}%</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Storage usage</span>
                  <span className="font-medium">{warehouse.currentUtilization}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      warehouse.currentUtilization > 75 ? 'bg-red-500' :
                      warehouse.currentUtilization > 50 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${warehouse.currentUtilization}%` }}
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/warehouses/${warehouse.id}`}
                  className="flex-1 text-center py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/5"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleDelete(warehouse.id)}
                  className="p-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {warehouses.length > 0 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * 10, warehouses.length)}</span> of{' '}
            <span className="font-medium">{warehouses.length}</span> results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {warehouses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No warehouses found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'No warehouses match your search criteria'
              : 'Get started by creating your first warehouse'
            }
          </p>
          <Link
            to="/warehouses/new"
            className="inline-flex items-center btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Warehouse
          </Link>
        </div>
      )}
    </div>
  );
};

export default WarehousesPage;