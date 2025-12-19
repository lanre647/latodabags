const Product = require('../models/product');
const config = require('../config/env');

// @desc    Get all products with filtering and pagination
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      featured,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      sort = '-createdAt',
    } = req.query;

    // Build filter object
    const filters = {};

    if (category) {
      filters.category = category.toLowerCase();
    }

    if (featured !== undefined) {
      filters.featured = featured === 'true';
    }

    if (search) {
      filters.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      filters.basePrice = {};
      if (minPrice) filters.basePrice.$gte = Number(minPrice);
      if (maxPrice) filters.basePrice.$lte = Number(maxPrice);
    }

    // Get paginated results
    const result = await Product.getPaginated(filters, {
      page: Number(page),
      limit: Number(limit),
      sort,
      select: '-__v', // Exclude __v from list, keep _id for frontend routing
    });

    res.status(200).json({
      success: true,
      count: result.products.length,
      pagination: result.pagination,
      data: result.products,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: config.env === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('-__v');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Get product error:', error);

    // Handle invalid MongoDB ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: config.env === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      basePrice,
      images,
      customOptions,
      description,
      category,
      featured,
    } = req.body;

    // Add creator to product
    const productData = {
      name,
      basePrice,
      images,
      customOptions,
      description,
      category,
      featured,
      createdBy: req.user._id,
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: config.env === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      basePrice,
      images,
      customOptions,
      description,
      category,
      featured,
    } = req.body;

    // Fields allowed to update
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (images !== undefined) updateData.images = images;
    if (customOptions !== undefined) updateData.customOptions = customOptions;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (featured !== undefined) updateData.featured = featured;

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Update product error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: config.env === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {},
    });
  } catch (error) {
    console.error('Delete product error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: config.env === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Get products by category
// @route   GET /api/v1/products/category/:category
// @access  Public
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12, sort = '-createdAt' } = req.query;

    const result = await Product.getPaginated(
      { category: category.toLowerCase() },
      {
        page: Number(page),
        limit: Number(limit),
        sort,
        select: '-_id -__v',
      }
    );

    res.status(200).json({
      success: true,
      category,
      count: result.products.length,
      pagination: result.pagination,
      data: result.products,
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: config.env === 'development' ? error.message : undefined,
    });
  }
};
