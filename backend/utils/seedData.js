const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Setting = require('../models/Setting');
const Order = require('../models/Order');
const InventoryLog = require('../models/InventoryLog');

const seedInitialData = async () => {
  try {
    // 1. Seed Default Users
    const userCount = await User.countDocuments({});
    let adminUser = null;
    let cashierUser = null;

    if (userCount === 0) {
      console.log('[Seed] Seeding default users (admin & cashier)...');
      adminUser = await User.create({
        username: 'admin',
        password: 'admin123',
        name: 'Restaurant Manager',
        role: 'admin',
        phone: '+1 555-0100',
        active: true,
      });

      cashierUser = await User.create({
        username: 'cashier1',
        password: 'cashier123',
        name: 'Sarah Jenkins',
        role: 'cashier',
        phone: '+1 555-0101',
        active: true,
      });
      console.log('[Seed] Users seeded successfully!');
    } else {
      adminUser = await User.findOne({ role: 'admin' });
      cashierUser = await User.findOne({ role: 'cashier' });
    }

    // 2. Seed Default Settings
    const settingCount = await Setting.countDocuments({});
    if (settingCount === 0) {
      console.log('[Seed] Seeding restaurant settings...');
      await Setting.create({
        restaurantName: 'The Rustic Fork Bistro',
        tagline: 'Artisan Eats & Fine Sips',
        address: '742 Evergreen Terrace, Suite 100',
        phone: '+1 (555) 234-5678',
        email: 'contact@rusticfork.pos',
        currencySymbol: '$',
        taxRate: 8.5,
        enableTax: true,
        receiptFooter: 'Thank you for choosing The Rustic Fork! Please visit again soon.',
        defaultLowStockAlert: 10,
      });
    }

    // 3. Seed Default Categories
    const categoryCount = await Category.countDocuments({});
    const categoryData = [
      { name: 'Burgers & Wraps', icon: 'Burger', color: '#ea580c', description: 'Gourmet handcrafted burgers & brioche wraps' },
      { name: 'Pizzas & Pasta', icon: 'Pizza', color: '#dc2626', description: 'Stone-baked artisan pizzas and fresh pasta' },
      { name: 'Main Grills', icon: 'Beef', color: '#b45309', description: 'Steaks, BBQ ribs, and grilled specialties' },
      { name: 'Starters & Sides', icon: 'UtensilsCrossed', color: '#16a34a', description: 'Crispy fries, wings, loaded nachos, and soups' },
      { name: 'Drinks & Cocktails', icon: 'Coffee', color: '#0284c7', description: 'Chilled craft beers, fresh juices, and coffees' },
      { name: 'Desserts & Sweets', icon: 'Cake', color: '#9333ea', description: 'Decadent cakes, sundaes, and cheesecakes' },
    ];

    let createdCategories = [];
    if (categoryCount === 0) {
      console.log('[Seed] Seeding categories...');
      createdCategories = await Category.insertMany(categoryData);
    } else {
      createdCategories = await Category.find({});
    }

    // 4. Seed Default Menu Items
    const menuCount = await MenuItem.countDocuments({});
    if (menuCount === 0) {
      console.log('[Seed] Seeding menu items...');
      const sampleItems = [
        {
          name: 'Classic Smash Cheeseburger',
          code: 'BGR-01',
          category: 'Burgers & Wraps',
          price: 12.99,
          costPrice: 4.5,
          stockQuantity: 45,
          minStockThreshold: 10,
          image: '🍔',
          description: 'Double beef patty, aged cheddar, pickles, secret sauce on brioche bun',
        },
        {
          name: 'Smoked BBQ Bacon Burger',
          code: 'BGR-02',
          category: 'Burgers & Wraps',
          price: 15.49,
          costPrice: 5.5,
          stockQuantity: 28,
          minStockThreshold: 8,
          image: '🥓',
          description: 'Crisp applewood bacon, smoked gouda, onion rings, BBQ sauce',
        },
        {
          name: 'Crispy Chicken Ranch Wrap',
          code: 'BGR-03',
          category: 'Burgers & Wraps',
          price: 11.99,
          costPrice: 3.8,
          stockQuantity: 35,
          minStockThreshold: 10,
          image: '🌯',
          description: 'Buttermilk fried chicken tenders, romaine lettuce, creamy herb ranch',
        },
        {
          name: 'Wood-fired Margherita Pizza',
          code: 'PIZ-01',
          category: 'Pizzas & Pasta',
          price: 14.5,
          costPrice: 4.0,
          stockQuantity: 40,
          minStockThreshold: 10,
          image: '🍕',
          description: 'San Marzano tomato base, fresh buffalo mozzarella, basil leaves',
        },
        {
          name: 'Truffle Pepperoni Supreme',
          code: 'PIZ-02',
          category: 'Pizzas & Pasta',
          price: 17.99,
          costPrice: 5.8,
          stockQuantity: 6, // Low stock sample!
          minStockThreshold: 10,
          image: '🍕',
          description: 'Artisan spicy pepperoni, wild mushroom, black truffle oil drizzle',
        },
        {
          name: 'Creamy Fettuccine Alfredo',
          code: 'PST-01',
          category: 'Pizzas & Pasta',
          price: 16.25,
          costPrice: 4.2,
          stockQuantity: 22,
          minStockThreshold: 8,
          image: '🍝',
          description: 'Rich parmesan cream sauce, garlic confit, fresh parsley, fettuccine',
        },
        {
          name: 'Prime Ribeye Steak (12oz)',
          code: 'GRL-01',
          category: 'Main Grills',
          price: 28.5,
          costPrice: 11.0,
          stockQuantity: 18,
          minStockThreshold: 5,
          image: '🥩',
          description: 'USDA Choice ribeye grilled to perfection with rosemary garlic butter',
        },
        {
          name: 'Grilled Salmon Fillet',
          code: 'GRL-02',
          category: 'Main Grills',
          price: 22.0,
          costPrice: 8.5,
          stockQuantity: 15,
          minStockThreshold: 5,
          image: '🐟',
          description: 'Pan-seared Atlantic salmon with lemon dill reduction & asparagus',
        },
        {
          name: 'Loaded Truffle Fries',
          code: 'STR-01',
          category: 'Starters & Sides',
          price: 8.99,
          costPrice: 2.1,
          stockQuantity: 50,
          minStockThreshold: 15,
          image: '🍟',
          description: 'Crispy skin-on fries, shaved parmesan, white truffle aioli',
        },
        {
          name: 'Buffalo Chicken Wings (8pcs)',
          code: 'STR-02',
          category: 'Starters & Sides',
          price: 11.5,
          costPrice: 3.9,
          stockQuantity: 5, // Low stock sample!
          minStockThreshold: 10,
          image: '🍗',
          description: 'Crispy wings tossed in signature tangy spicy buffalo sauce',
        },
        {
          name: 'Fresh Passionfruit Mojito',
          code: 'DRK-01',
          category: 'Drinks & Cocktails',
          price: 6.5,
          costPrice: 1.5,
          stockQuantity: 60,
          minStockThreshold: 15,
          image: '🍹',
          description: 'Fresh mint, lime wedges, passion fruit puree, chilled sparkling soda',
        },
        {
          name: 'Iced Caramel Macchiato',
          code: 'DRK-02',
          category: 'Drinks & Cocktails',
          price: 5.25,
          costPrice: 1.2,
          stockQuantity: 40,
          minStockThreshold: 12,
          image: '☕',
          description: 'Espresso poured over whole milk with vanilla syrup & caramel drizzle',
        },
        {
          name: 'Warm Chocolate Lava Cake',
          code: 'DES-01',
          category: 'Desserts & Sweets',
          price: 7.99,
          costPrice: 2.2,
          stockQuantity: 25,
          minStockThreshold: 6,
          image: '🍫',
          description: 'Molten Belgian dark chocolate center served with vanilla bean gelato',
        },
        {
          name: 'New York Baked Cheesecake',
          code: 'DES-02',
          category: 'Desserts & Sweets',
          price: 7.5,
          costPrice: 2.0,
          stockQuantity: 19,
          minStockThreshold: 6,
          image: '🍰',
          description: 'Creamy classic cheesecake with strawberry coulis on graham crust',
        },
      ];

      await MenuItem.insertMany(sampleItems);
      console.log('[Seed] Menu items seeded successfully!');
    }

    // 5. Seed Tables
    const tableCount = await Table.countDocuments({});
    if (tableCount === 0) {
      console.log('[Seed] Seeding restaurant tables...');
      const tables = [
        { tableNumber: 'Table 1', capacity: 2, status: 'available' },
        { tableNumber: 'Table 2', capacity: 2, status: 'available' },
        { tableNumber: 'Table 3', capacity: 4, status: 'available' },
        { tableNumber: 'Table 4', capacity: 4, status: 'available' },
        { tableNumber: 'Table 5', capacity: 4, status: 'available' },
        { tableNumber: 'Table 6', capacity: 6, status: 'available' },
        { tableNumber: 'Table 7', capacity: 6, status: 'available' },
        { tableNumber: 'Table 8', capacity: 8, status: 'available' },
        { tableNumber: 'Table 9 (Patio)', capacity: 4, status: 'available' },
        { tableNumber: 'Table 10 (Patio)', capacity: 4, status: 'available' },
        { tableNumber: 'VIP Booth 1', capacity: 6, status: 'available' },
        { tableNumber: 'VIP Booth 2', capacity: 8, status: 'available' },
      ];
      await Table.insertMany(tables);
      console.log('[Seed] Tables seeded successfully!');
    }

    // 6. Seed Sample Orders if empty to give lively charts
    const orderCount = await Order.countDocuments({});
    if (orderCount === 0 && adminUser && cashierUser) {
      console.log('[Seed] Seeding sample completed transactions for demo reports...');
      const menuItems = await MenuItem.find({});
      if (menuItems.length >= 4) {
        const item1 = menuItems[0];
        const item2 = menuItems[3];
        const item3 = menuItems[8];
        const item4 = menuItems[10];

        const sampleOrders = [
          {
            orderNumber: 'ORD-20260930-0001',
            orderType: 'dine-in',
            tableNumber: 'Table 3',
            cashier: { id: cashierUser._id, username: cashierUser.username, name: cashierUser.name },
            customerName: 'Alex Mercer',
            items: [
              { menuItemId: item1._id, name: item1.name, price: item1.price, costPrice: item1.costPrice, quantity: 2, subtotal: item1.price * 2 },
              { menuItemId: item3._id, name: item3.name, price: item3.price, costPrice: item3.costPrice, quantity: 1, subtotal: item3.price },
            ],
            subtotal: item1.price * 2 + item3.price,
            discountPercent: 0,
            discountAmount: 0,
            taxPercent: 8.5,
            taxAmount: Math.round(((item1.price * 2 + item3.price) * 0.085) * 100) / 100,
            totalAmount: Math.round(((item1.price * 2 + item3.price) * 1.085) * 100) / 100,
            paymentMethod: 'cash',
            amountPaid: 50,
            changeAmount: 50 - Math.round(((item1.price * 2 + item3.price) * 1.085) * 100) / 100,
            paymentStatus: 'paid',
            orderStatus: 'completed',
            completedAt: new Date(Date.now() - 3600 * 1000 * 3),
            createdAt: new Date(Date.now() - 3600 * 1000 * 3),
          },
          {
            orderNumber: 'ORD-20260930-0002',
            orderType: 'takeaway',
            tableNumber: 'Takeaway',
            cashier: { id: cashierUser._id, username: cashierUser.username, name: cashierUser.name },
            customerName: 'Elena Rostova',
            items: [
              { menuItemId: item2._id, name: item2.name, price: item2.price, costPrice: item2.costPrice, quantity: 1, subtotal: item2.price },
              { menuItemId: item4._id, name: item4.name, price: item4.price, costPrice: item4.costPrice, quantity: 2, subtotal: item4.price * 2 },
            ],
            subtotal: item2.price + item4.price * 2,
            discountPercent: 10,
            discountAmount: Math.round(((item2.price + item4.price * 2) * 0.1) * 100) / 100,
            taxPercent: 8.5,
            taxAmount: Math.round(((item2.price + item4.price * 2) * 0.9 * 0.085) * 100) / 100,
            totalAmount: Math.round(((item2.price + item4.price * 2) * 0.9 * 1.085) * 100) / 100,
            paymentMethod: 'card',
            amountPaid: Math.round(((item2.price + item4.price * 2) * 0.9 * 1.085) * 100) / 100,
            changeAmount: 0,
            paymentStatus: 'paid',
            orderStatus: 'completed',
            completedAt: new Date(Date.now() - 3600 * 1000 * 1),
            createdAt: new Date(Date.now() - 3600 * 1000 * 1),
          },
        ];

        await Order.insertMany(sampleOrders);
        console.log('[Seed] Sample demo orders created!');
      }
    }
  } catch (error) {
    console.error('[Seed Error]:', error.message);
  }
};

module.exports = seedInitialData;
