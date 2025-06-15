const swaggerJsdoc = require('swagger-jsdoc');
const dotenv = require('dotenv');
dotenv.config();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BlossomHub API',
      version: '1.0.0',
      description:
        'API for an online flower shop, managing inventory, categories, users, orders, and wishlists.',
    },
    servers: [
      {
        url: `${process.env.BASE_URL || 'http://localhost:3000'}/api`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token here to access protected routes.',
        },
      },
      schemas: {
        Flower: {
          type: 'object',
          required: ['name', 'price', 'category', 'stock'],
          properties: {
            name: { type: 'string', example: 'Red Rose' },
            description: {
              type: 'string',
              example: 'A beautiful vibrant red rose.',
            },
            price: { type: 'number', format: 'float', example: 15.99 },
            category: {
              type: 'string',
              example: '60d0fe4f5311236168a9b34b',
              description: 'Category ID',
            },
            imageUrl: {
              type: 'string',
              example: 'https://example.com/red_rose.jpg',
            },
            stock: { type: 'integer', example: 100 },
            isFeatured: { type: 'boolean', example: false },
          },
        },
        Category: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Roses' },
            description: { type: 'string', example: 'Various types of roses.' },
          },
        },
        User: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            displayName: { type: 'string', example: 'John Doe' },
            profilePicture: {
              type: 'string',
              example: 'https://lh3.googleusercontent.com/a/image.jpg',
            },
            isAdmin: { type: 'boolean', example: false },
          },
        },
        Wishlist: {
          type: 'object',
          properties: {
            user: {
              type: 'string',
              example: '60d0fe4f5311236168a9b34a',
              description: 'User ID',
            },
            flowers: {
              type: 'array',
              items: { type: 'string', example: '60d0fe4f5311236168a9b34b' },
            },
          },
        },
        Order: {
          type: 'object',
          required: ['user', 'items', 'totalAmount', 'shippingAddress'],
          properties: {
            user: {
              type: 'string',
              example: '60d0fe4f5311236168a9b34a',
              description: 'User ID',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  flower: {
                    type: 'string',
                    example: '60d0fe4f5311236168a9b34b',
                    description: 'Flower ID',
                  },
                  quantity: { type: 'integer', example: 2 },
                  priceAtPurchase: {
                    type: 'number',
                    format: 'float',
                    example: 15.99,
                  },
                },
              },
            },
            totalAmount: { type: 'number', format: 'float', example: 31.98 },
            status: {
              type: 'string',
              enum: [
                'pending',
                'processing',
                'shipped',
                'delivered',
                'cancelled',
              ],
              example: 'pending',
            },
            shippingAddress: {
              type: 'object',
              properties: {
                street: { type: 'string', example: '123 Flower St' },
                city: { type: 'string', example: 'Bloomtown' },
                state: { type: 'string', example: 'CA' },
                zipCode: { type: 'string', example: '90210' },
                country: { type: 'string', example: 'USA' },
              },
            },
            orderDate: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },

  apis: [
    './routes/flowerRoutes.js',
    './routes/orderRoutes.js',
    './routes/categoryRoutes.js',
    './routes/userRoutes.js',
    './models/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
