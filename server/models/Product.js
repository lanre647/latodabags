const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative'],
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: function (arr) {
          return arr && arr.length > 0;
        },
        message: 'Product must have at least one image',
      },
    },
    customOptions: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          type: {
            type: String,
            required: true,
            enum: {
              values: ['select', 'text', 'color', 'number'],
              message: '{VALUE} is not a valid option type',
            },
          },
          options: {
            type: [String],
            validate: {
              validator: function (arr) {
                // Options array required only for 'select' and 'color' types
                if (this.type === 'select' || this.type === 'color') {
                  return arr && arr.length > 0;
                }
                return true;
              },
              message: 'Options array is required for select and color types',
            },
          },
          priceModifier: {
            type: Number,
            default: 0,
          },
        },
      ],
      default: [],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: {
        values: ['tote', 'sling', 'clutch', 'backpack', 'crossbody'],
        message: '{VALUE} is not a valid category',
      },
      lowercase: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
ProductSchema.index({ category: 1, createdAt: -1 });
ProductSchema.index({ featured: 1, createdAt: -1 });
ProductSchema.index({ name: 'text', description: 'text' });

// Virtual to expose _id as id for frontend routing
ProductSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Virtual for reviews
ProductSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
  justOne: false,
});

// Method to calculate final price with custom options
ProductSchema.methods.calculatePrice = function (selectedOptions = {}) {
  let finalPrice = this.basePrice;

  // Add price modifiers from selected custom options
  this.customOptions.forEach((option) => {
    if (selectedOptions[option.name] && option.priceModifier) {
      finalPrice += option.priceModifier;
    }
  });

  return finalPrice;
};

// Static method to get products with pagination
ProductSchema.statics.getPaginated = async function (
  filters = {},
  options = {}
) {
  const {
    page = 1,
    limit = 12,
    sort = '-createdAt',
    select = '-__v',
  } = options;

  const skip = (page - 1) * limit;

  const query = this.find(filters)
    .select(select)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const products = await query;
  const total = await this.countDocuments(filters);

  return {
    products,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = mongoose.model('Product', ProductSchema);
