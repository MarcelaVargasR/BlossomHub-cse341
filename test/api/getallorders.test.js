const getCategories = async (req, res, next) => {
  try {
    const { clientId, sort } = req.query;
    let query = Category.find();

    // Filter by clientId if provided
    if (clientId) {
      query = query.where({ clientId });
    }

    // Apply sorting if specified
    if (sort) {
      query = query.sort({ [sort]: 1 }); // Adjust sorting direction if needed
    }

    const categories = await query.exec();

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};
