import mongoose, { Schema, Document } from 'mongoose'

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  productId: mongoose.Types.ObjectId
  orderId: string
  openOrderId?: string // 虎皮椒返回的订单ID
  amount: number
  status: 'pending' | 'paid' | 'failed'
  createdAt: Date
  paidAt?: Date
}

const OrderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  openOrderId: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paidAt: {
    type: Date,
  },
})

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)
