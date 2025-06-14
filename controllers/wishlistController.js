// controllers/wishlistController.js
const Wishlist = require('../models/Wishlist');
const Flower = require('../models/Flower'); // To validate flower existence

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private (Authenticated user only)
exports.getWishlist = async (req, res, next) => {
    try {
        // Find wishlist for the authenticated user
        let wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
            path: 'flowers',
            select: 'name price imageUrl'
        });

        // If no wishlist exists, return an empty one (or create one on the fly)
        if (!wishlist) {
            wishlist = await Wishlist.create({ user: req.user.id, flowers: [] });
            return res.status(201).json({ success: true, data: wishlist, message: 'New wishlist created for user' });
        }

        res.status(200).json({
            success: true,
            data: wishlist,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add flower to wishlist
// @route   POST /api/wishlist/:flowerId
// @access  Private (Authenticated user only)
exports.addFlowerToWishlist = async (req, res, next) => {
    const { flowerId } = req.params;

    try {
        // Validate if flower exists
        const flower = await Flower.findById(flowerId);
        if (!flower) {
            return res.status(404).json({ success: false, error: 'Flower not found' });
        }

        let wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            // Create a new wishlist if one doesn't exist
            wishlist = await Wishlist.create({ user: req.user.id, flowers: [flowerId] });
        } else {
            // Check if flower already in wishlist to prevent duplicates
            if (wishlist.flowers.includes(flowerId)) {
                return res.status(400).json({ success: false, error: 'Flower already in wishlist' });
            }
            wishlist.flowers.push(flowerId);
            wishlist.updatedAt = Date.now(); // Manual update
            await wishlist.save();
        }

        // Re-populate to send back full flower details
        wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
            path: 'flowers',
            select: 'name price imageUrl'
        });

        res.status(200).json({
            success: true,
            message: 'Flower added to wishlist',
            data: wishlist,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove flower from wishlist
// @route   DELETE /api/wishlist/:flowerId
// @access  Private (Authenticated user only)
exports.removeFlowerFromWishlist = async (req, res, next) => {
    const { flowerId } = req.params;

    try {
        let wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            return res.status(404).json({ success: false, error: 'Wishlist not found for this user' });
        }

        const initialLength = wishlist.flowers.length;
        wishlist.flowers = wishlist.flowers.filter(
            (id) => id.toString() !== flowerId
        );

        if (wishlist.flowers.length === initialLength) {
            return res.status(404).json({ success: false, error: 'Flower not found in wishlist' });
        }

        wishlist.updatedAt = Date.now(); // Manual update
        await wishlist.save();

        // Re-populate to send back full flower details
        wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
            path: 'flowers',
            select: 'name price imageUrl'
        });

        res.status(200).json({
            success: true,
            message: 'Flower removed from wishlist',
            data: wishlist,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear user's entire wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private (Authenticated user only)
exports.clearWishlist = async (req, res, next) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user.id });

        if (!wishlist) {
            return res.status(404).json({ success: false, error: 'Wishlist not found for this user' });
        }

        wishlist.flowers = [];
        wishlist.updatedAt = Date.now(); // Manual update
        await wishlist.save();

        res.status(200).json({
            success: true,
            message: 'Wishlist cleared successfully',
            data: wishlist, // Returns empty wishlist
        });
    } catch (error) {
        next(error);
    }
};