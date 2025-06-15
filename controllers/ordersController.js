const Order = require('../models/Order');
const Flower = require('../models/Flower');

/**
 * @desc    Get all orders (optionally filter by user)
 * @route   GET /orders
 * @access  Public
 */
const getOrders = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.userId) {
      query.user = req.query.userId;
    }

    const orders = await Order.find(query)
      .populate('user', 'email displayName')
      .populate('items.flower', 'name price');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    console.log("🚀 ~ getOrders ~ err:", err)
    next(err);
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /orders/:id
 * @access  Public
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'email displayName')
      .populate('items.flower', 'name price');

    if (!order) {
      const error = new Error(`Order not found with ID ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new order
 * @route   POST /orders
 * @access  Public
 */
const createOrder = async (req, res, next) => {
  try {
    const { user, items, shippingAddress } = req.body;

    // Fetch flower prices to compute total and validate flowers
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const flower = await Flower.findById(item.flower);
      if (!flower) {
        const error = new Error(`Flower not found with ID ${item.flower}`);
        error.statusCode = 400;
        return next(error);
      }

      const priceAtPurchase = flower.price;
      const itemTotal = priceAtPurchase * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        flower: flower._id,
        quantity: item.quantity,
        priceAtPurchase,
      });
    }

    const newOrder = new Order({
      user,
      items: orderItems,
      totalAmount,
      shippingAddress,
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({ success: true, data: savedOrder });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update order status
 * @route   PUT /orders/:id/status
 * @access  Public
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedOrder) {
      const error = new Error(`Order not found with ID ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete an order
 * @route   DELETE /orders/:id
 * @access  Public
 */
const deleteOrder = async (req, res, next) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      const error = new Error(`Order not found with ID ${req.params.id}`);
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({ success: true, message: 'Order deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
