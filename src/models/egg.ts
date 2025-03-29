import mongoose, { Schema, Document } from 'mongoose';

export interface IEgg extends Document {
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const EggSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['regular', 'organic', 'free-range', 'specialty'],
    default: 'regular'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes
EggSchema.index({ name: 1 });
EggSchema.index({ category: 1 });
EggSchema.index({ price: 1 });

// Add virtual for stock status
EggSchema.virtual('inStock').get(function() {
  return this.quantity > 0;
});

// Add methods
EggSchema.methods.updateStock = function(quantity: number) {
  this.quantity = Math.max(0, this.quantity + quantity);
  return this.save();
};

EggSchema.methods.adjustPrice = function(adjustment: number) {
  this.price = Math.max(0, this.price + adjustment);
  return this.save();
};

// Add statics
EggSchema.statics.findByCategory = function(category: string) {
  return this.find({ category });
};

EggSchema.statics.findInStock = function() {
  return this.find({ quantity: { $gt: 0 } });
};

// Add middleware
EggSchema.pre('save', function(next) {
  if (this.quantity < 0) {
    this.quantity = 0;
  }
  if (this.price < 0) {
    this.price = 0;
  }
  next();
});

export const Egg = mongoose.model<IEgg>('Egg', EggSchema); 