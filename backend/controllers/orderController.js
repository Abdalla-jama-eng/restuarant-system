const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const InventoryLog = require('../models/InventoryLog');
const Setting = require('../models/Setting');

// Helper to generate next sequential Order Number
const generateOrderNumber = async () => {
  const count = await Order.countDocuments({});
  const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const sequence = String(count + 1).padStart(4, '0');
  return `ORD-${timestamp}-${sequence}`;
};

// @desc Create a new order
// @route POST /api/orders
// @access Private
const createOrder = async (req, res) => {
  try {
    const {
      orderType,
      tableId,
      tableNumber,
      customerName,
      customerPhone,
      items,
      discountPercent,
      discountReason,
      paymentMethod,
      amountPaid,
      settleImmediately,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Fetch system settings for tax rate
    const settings = await Setting.findOne({});
    const taxRate = settings && settings.enableTax ? (settings.taxRate || 0) : 0;

    // Verify stock and prepare items with snapshot prices
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const dbItem = await MenuItem.findById(item.menuItemId || item._id);
      if (!dbItem) {
        return res.status(404).json({ message: `Menu item not found: ${item.name}` });
      }

      if (dbItem.stockQuantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${dbItem.name}". Available: ${dbItem.stockQuantity}, Requested: ${item.quantity}`,
        });
      }

      const itemSubtotal = dbItem.price * item.quantity;
      subtotal += itemSubtotal;

      processedItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        costPrice: dbItem.costPrice || 0,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        notes: item.notes || '',
      });
    }

    // Calculate totals
    const discPercent = Number(discountPercent) || 0;
    const discountAmount = Math.round(((subtotal * discPercent) / 100) * 100) / 100;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    const orderNumber = await generateOrderNumber();

    // Deduct stock and log
    for (const item of processedItems) {
      const dbItem = await MenuItem.findById(item.menuItemId);
      const prevStock = dbItem.stockQuantity;
      dbItem.stockQuantity = Math.max(0, prevStock - item.quantity);
      await dbItem.save();

      await InventoryLog.create({
        menuItemId: dbItem._id,
        itemName: dbItem.name,
        changeType: 'sale',
        quantityChanged: -item.quantity,
        previousStock: prevStock,
        newStock: dbItem.stockQuantity,
        reason: `Order sale #${orderNumber}`,
        orderNumber: orderNumber,
        user: {
          id: req.user._id,
          name: req.user.name,
        },
      });
    }

    const isPaid = settleImmediately === true || (amountPaid && Number(amountPaid) >= totalAmount);
    const paidAmt = isPaid ? (Number(amountPaid) || totalAmount) : 0;
    const changeAmt = isPaid && paidAmt > totalAmount ? Math.round((paidAmt - totalAmount) * 100) / 100 : 0;

    const order = await Order.create({
      orderNumber,
      orderType: orderType || 'dine-in',
      tableId: tableId || null,
      tableNumber: tableNumber || (orderType === 'takeaway' ? 'Takeaway' : 'Counter'),
      cashier: {
        id: req.user._id,
        username: req.user.username,
        name: req.user.name,
      },
      customerName: customerName || 'Walk-in Guest',
      customerPhone: customerPhone || '',
      items: processedItems,
      subtotal,
      discountPercent: discPercent,
      discountAmount,
      discountReason: discountReason || '',
      taxPercent: taxRate,
      taxAmount,
      totalAmount,
      paymentMethod: paymentMethod || (isPaid ? 'cash' : 'unpaid'),
      amountPaid: paidAmt,
      changeAmount: changeAmt,
      paymentStatus: isPaid ? 'paid' : 'unpaid',
      orderStatus: isPaid ? 'completed' : 'pending',
      completedAt: isPaid ? new Date() : null,
    });

    // Update Table status if Dine-In
    if (orderType === 'dine-in' && tableId) {
      const table = await Table.findById(tableId);
      if (table) {
        if (isPaid) {
          table.status = 'available';
          table.currentOrderId = null;
          table.currentGuests = 0;
        } else {
          table.status = 'occupied';
          table.currentOrderId = order._id;
        }
        await table.save();
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all orders with query filters
// @route GET /api/orders
// @access Private
const getOrders = async (req, res) => {
  try {
    const { status, paymentStatus, orderType, startDate, endDate, cashierId, search, limit = 100 } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query.orderStatus = status;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }

    if (orderType && orderType !== 'All') {
      query.orderType = orderType;
    }

    if (cashierId) {
      query['cashier.id'] = cashierId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { tableNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get order by ID or orderNumber
// @route GET /api/orders/:id
// @access Private
const getOrderById = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) {
      order = await Order.findOne({ orderNumber: req.params.id });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Settle Payment for an open order
// @route POST /api/orders/:id/pay
// @access Private
const settlePayment = async (req, res) => {
  try {
    const { paymentMethod, amountPaid } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    const paid = Number(amountPaid) || order.totalAmount;
    if (paid < order.totalAmount && paymentMethod === 'cash') {
      return res.status(400).json({ message: `Amount paid ($${paid}) is less than total amount ($${order.totalAmount})` });
    }

    const change = Math.max(0, Math.round((paid - order.totalAmount) * 100) / 100);

    order.paymentMethod = paymentMethod || 'cash';
    order.amountPaid = paid;
    order.changeAmount = change;
    order.paymentStatus = 'paid';
    order.orderStatus = 'completed';
    order.completedAt = new Date();

    const savedOrder = await order.save();

    // Release table if linked
    if (order.tableId) {
      const table = await Table.findById(order.tableId);
      if (table && table.currentOrderId && table.currentOrderId.toString() === order._id.toString()) {
        table.status = 'available';
        table.currentOrderId = null;
        table.currentGuests = 0;
        await table.save();
      }
    }

    res.json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update Order Status (e.g. pending -> preparing -> ready -> completed)
// @route PATCH /api/orders/:id/status
// @access Private
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.orderStatus = status;
    if (status === 'completed' && !order.completedAt) {
      order.completedAt = new Date();
    }

    // If completed and paid, free table
    if (status === 'completed' && order.paymentStatus === 'paid' && order.tableId) {
      const table = await Table.findById(order.tableId);
      if (table && table.currentOrderId && table.currentOrderId.toString() === order._id.toString()) {
        table.status = 'available';
        table.currentOrderId = null;
        await table.save();
      }
    }

    const updated = await order.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Cancel order and restore inventory
// @route POST /api/orders/:id/cancel
// @access Private
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled' });
    }

    // Restore inventory
    for (const item of order.items) {
      const dbItem = await MenuItem.findById(item.menuItemId);
      if (dbItem) {
        const prevStock = dbItem.stockQuantity;
        dbItem.stockQuantity = prevStock + item.quantity;
        await dbItem.save();

        await InventoryLog.create({
          menuItemId: dbItem._id,
          itemName: dbItem.name,
          changeType: 'cancellation_return',
          quantityChanged: item.quantity,
          previousStock: prevStock,
          newStock: dbItem.stockQuantity,
          reason: `Cancelled Order #${order.orderNumber} - ${reason || 'Customer cancelled'}`,
          orderNumber: order.orderNumber,
          user: {
            id: req.user._id,
            name: req.user.name,
          },
        });
      }
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = reason || 'Cancelled by staff';
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }

    const cancelledOrder = await order.save();

    // Release table
    if (order.tableId) {
      const table = await Table.findById(order.tableId);
      if (table && table.currentOrderId && table.currentOrderId.toString() === order._id.toString()) {
        table.status = 'available';
        table.currentOrderId = null;
        table.currentGuests = 0;
        await table.save();
      }
    }

    res.json(cancelledOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  settlePayment,
  updateOrderStatus,
  cancelOrder,
};
