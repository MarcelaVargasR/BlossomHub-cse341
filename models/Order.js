const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    flower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flower',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1.'],
    },
    priceAtPurchase: { // Store price at the time of order to prevent historical price changes affecting past orders
        type: Number,
        required: true,
        min: [0, 'Price at purchase cannot be negative.'],
    }
}, { _id: false }); // Don't create an _id for sub-documents if not needed

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be negative.'],
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    shippingAddress: {
        street: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        zipCode: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Order', orderSchema);