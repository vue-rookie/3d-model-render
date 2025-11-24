import mongoose, { Schema, Document } from 'mongoose'

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  description: string
  price: number
  image: string
  modelUrl: string
  downloadUrl: string
  category: string
  createdAt: Date
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    type: String,
    required: true,
  },
  modelUrl: {
    type: String,
    required: true,
  },
  downloadUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)
