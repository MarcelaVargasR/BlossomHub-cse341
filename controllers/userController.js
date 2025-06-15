const User = require("../models/User"); // Import your User model

exports.createUser = async (req, res, next) => {
  try {
    const githubUser = req.user;
    const [email] = githubUser.emails;
    const existingUser = await User.findOne({ email: email.value });
    if (existingUser) {
        return 
    }
    await new User({
        githubId : githubUser.id,
        email: email.value,
        displayName: githubUser.displayName,
        isAdmin: false,
    }).save()
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  // This route should be protected by middleware that checks for 'admin' role
  try {
    // Find all users and exclude sensitive fields like googleId or password hash if you add one later
    const users = await User.find();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error); // Pass error to the centralized error handler
  }
};

// @desc    Get single user by ID or get current user's profile
// @route   GET /api/users/:id OR GET /api/users/me
// @access  Private (Admin or owner of the profile)
exports.getUserById = async (req, res, next) => {
  try {
    let user;

    // If the request is for '/api/users/me', use the authenticated user's ID
    if (req.params.id === "me") {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: "Not authorized, no user session found.",
        });
      }
      user = await User.findById(req.user.id);
    } else {
      // Otherwise, retrieve by the ID provided in the URL parameter
      user = await User.findById(req.params.id);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Authorization check: Ensure admin or the user themselves can view
    // If an admin is requesting, allow. If a customer, ensure it's their own profile.
    if (
      req.user &&
      req.user.role !== "admin" &&
      user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to view this user profile",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error); // Pass error to the centralized error handler
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id OR PUT /api/users/me
// @access  Private (Admin or owner of the profile)
exports.updateUser = async (req, res, next) => {
  try {
    let user;
    const targetId = req.params.id === "me" ? req.user.id : req.params.id;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Not authorized, no user session found.",
      });
    }

    user = await User.findById(targetId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Authorization check: Admin or the user themselves
    if (req.user.role !== "admin" && user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to update this user profile",
      });
    }

    // Prevent non-admins from changing their role
    if (
      req.body.role &&
      req.user.role !== "admin" &&
      req.body.role !== user.role
    ) {
      return res
        .status(403)
        .json({ success: false, error: "Not authorized to change user role" });
    }

    // Fields allowed for update by a user themselves (if not admin)
    const allowedUpdates = [
      "displayName",
      "profilePicture",
      "phoneNumber",
      "address",
    ]; // Add/remove fields as needed
    const updates = {};
    if (req.user.role !== "admin") {
      // Filter allowed updates for non-admin users
      Object.keys(req.body).forEach((key) => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });
    } else {
      // Admins can update anything except perhaps the user's googleId directly
      Object.assign(updates, req.body);
      delete updates.googleId; // Prevent direct update of googleId via this route
    }

    // Manual update of 'updatedAt' field, as pre('save') hook won't fire for findByIdAndUpdate
    updates.updatedAt = Date.now();

    user = await User.findByIdAndUpdate(
      targetId,
      updates,
      { new: true, runValidators: true } // Return the updated document, run Mongoose validators
    )

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error); // Pass error to the centralized error handler
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  // This route should be protected by middleware that checks for 'admin' role
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Optional: Prevent an admin from deleting themselves if they are the last admin
    // This is a safety measure for production systems.
    if (user._id.toString() === req.user.id && req.user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete the last admin user.",
        });
      }
    }

    await user.deleteOne(); // Mongoose 5.x/6.x: user.remove() or user.deleteOne()

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error); // Pass error to the centralized error handler
  }
};
