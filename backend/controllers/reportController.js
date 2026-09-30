const Order = require('../models/Order');

// Helper to get start and end dates
const getDateRange = (period, customStart, customEnd) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'yesterday') {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'weekly' || period === 'week') {
    // Last 7 days
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'monthly' || period === 'month') {
    // Current month start
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'custom' && customStart && customEnd) {
    start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
  } else {
    // Default today
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

// @desc Get comprehensive sales and revenue reports
// @route GET /api/reports/sales
// @access Private/Admin
const getSalesReport = async (req, res) => {
  try {
    const { period = 'today', startDate, endDate } = req.query;
    const { start, end } = getDateRange(period, startDate, endDate);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
    });

    const completedOrders = orders.filter((o) => o.orderStatus === 'completed' && o.paymentStatus === 'paid');
    const cancelledOrders = orders.filter((o) => o.orderStatus === 'cancelled');
    const pendingOrders = orders.filter((o) => o.orderStatus === 'pending');

    const totalGrossSales = completedOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const totalDiscounts = completedOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
    const totalTax = completedOrders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);
    const totalNetRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Calculate Estimated COGS (Cost of goods sold) & Profit
    let totalCogs = 0;
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        totalCogs += (item.costPrice || 0) * item.quantity;
      });
    });

    const estimatedGrossProfit = Math.max(0, totalNetRevenue - totalTax - totalCogs);

    // Breakdown by payment method
    const paymentMethods = {
      cash: { count: 0, total: 0 },
      card: { count: 0, total: 0 },
      mobile: { count: 0, total: 0 },
    };

    completedOrders.forEach((o) => {
      const pm = o.paymentMethod || 'cash';
      if (!paymentMethods[pm]) {
        paymentMethods[pm] = { count: 0, total: 0 };
      }
      paymentMethods[pm].count += 1;
      paymentMethods[pm].total += o.totalAmount;
    });

    // Breakdown by Order Type (Dine-in vs Takeaway)
    const orderTypes = {
      'dine-in': { count: 0, total: 0 },
      takeaway: { count: 0, total: 0 },
    };

    completedOrders.forEach((o) => {
      const type = o.orderType || 'dine-in';
      if (!orderTypes[type]) {
        orderTypes[type] = { count: 0, total: 0 };
      }
      orderTypes[type].count += 1;
      orderTypes[type].total += o.totalAmount;
    });

    // Cashier performance
    const cashierStats = {};
    completedOrders.forEach((o) => {
      const cashierName = o.cashier && o.cashier.name ? o.cashier.name : 'Unknown';
      if (!cashierStats[cashierName]) {
        cashierStats[cashierName] = {
          name: cashierName,
          ordersCount: 0,
          totalSales: 0,
        };
      }
      cashierStats[cashierName].ordersCount += 1;
      cashierStats[cashierName].totalSales += o.totalAmount;
    });

    // Top selling items
    const itemMap = {};
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = {
            name: item.name,
            quantitySold: 0,
            revenue: 0,
            price: item.price,
          };
        }
        itemMap[item.name].quantitySold += item.quantity;
        itemMap[item.name].revenue += item.subtotal;
      });
    });

    const topSellingItems = Object.values(itemMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    // Daily breakdown for charts if weekly or monthly
    const timelineMap = {};
    completedOrders.forEach((o) => {
      const dateKey = new Date(o.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { date: dateKey, revenue: 0, orders: 0 };
      }
      timelineMap[dateKey].revenue += o.totalAmount;
      timelineMap[dateKey].orders += 1;
    });

    const timelineData = Object.values(timelineMap);

    res.json({
      period,
      startDate: start,
      endDate: end,
      summary: {
        totalOrders: orders.length,
        completedCount: completedOrders.length,
        cancelledCount: cancelledOrders.length,
        pendingCount: pendingOrders.length,
        totalGrossSales: Math.round(totalGrossSales * 100) / 100,
        totalDiscounts: Math.round(totalDiscounts * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalNetRevenue: Math.round(totalNetRevenue * 100) / 100,
        totalCogs: Math.round(totalCogs * 100) / 100,
        estimatedGrossProfit: Math.round(estimatedGrossProfit * 100) / 100,
        averageOrderValue:
          completedOrders.length > 0
            ? Math.round((totalNetRevenue / completedOrders.length) * 100) / 100
            : 0,
      },
      paymentMethods,
      orderTypes,
      cashierPerformance: Object.values(cashierStats),
      topSellingItems,
      timelineData,
      cancelledOrders: cancelledOrders.map((o) => ({
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        totalAmount: o.totalAmount,
        reason: o.cancelReason,
        cashier: o.cashier ? o.cashier.name : 'Unknown',
        createdAt: o.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSalesReport };
