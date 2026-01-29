// src/config/swagger.ts
import { Options } from 'swagger-jsdoc';

const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Warehouse Management API',
      version: '1.0.0',
      description: 'API documentation for the Smart Warehouse Management System',
      contact: {
        name: 'API Support',
        email: 'support@warehouse.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.warehouse.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            fullName: {
              type: 'string',
              example: 'John Doe',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'VIEWER'],
              example: 'VIEWER',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            sku: {
              type: 'string',
              example: 'ELEC-001',
            },
            name: {
              type: 'string',
              example: 'Laptop',
            },
            category: {
              type: 'string',
              example: 'Electronics',
            },
            description: {
              type: 'string',
              example: 'High-performance laptop',
            },
            unitPrice: {
              type: 'number',
              format: 'float',
              example: 999.99,
            },
            reorderPoint: {
              type: 'integer',
              example: 10,
            },
            optimalStock: {
              type: 'integer',
              example: 50,
            },
          },
        },
        Warehouse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Main Warehouse',
            },
            location: {
              type: 'string',
              example: '123 Main St, City',
            },
            capacity: {
              type: 'integer',
              example: 1000,
            },
            currentUtilization: {
              type: 'integer',
              example: 65,
            },
          },
        },
        Inventory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            productId: {
              type: 'string',
              format: 'uuid',
            },
            warehouseId: {
              type: 'string',
              format: 'uuid',
            },
            quantity: {
              type: 'integer',
              example: 100,
            },
            locationInWarehouse: {
              type: 'string',
              example: 'A1-05',
            },
          },
        },
        Alert: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            type: {
              type: 'string',
              enum: ['low_stock', 'overstock', 'expiry', 'theft'],
              example: 'low_stock',
            },
            severity: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'critical'],
              example: 'medium',
            },
            message: {
              type: 'string',
              example: 'Product stock is below reorder point',
            },
            isResolved: {
              type: 'boolean',
              example: false,
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1,
                },
                limit: {
                  type: 'integer',
                  example: 20,
                },
                total: {
                  type: 'integer',
                  example: 100,
                },
                totalPages: {
                  type: 'integer',
                  example: 5,
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API routes
};

export default swaggerOptions;