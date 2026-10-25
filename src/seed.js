/**
 * Seed script to populate demo data for Homemade Tiffin Management App
 */

const {
  User,
  OwnerProfile,
  CustomerProfile,
  MenuItem,
  SubscriptionPlan,
  PlanItem,
  Subscription,
  Order,
  OrderItem,
  Payment,
  SkipRequest,
  Notification,
  ServiceCalendar,
  sequelize,
} = require('./models');

const seedData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connecting to database...');

    // 1. Create or update Owner User
    const [ownerUser] = await User.findOrCreate({
      where: { phone: '+919876543210' },
      defaults: {
        phone: '+919876543210',
        name: 'Sunita Sharma',
        email: 'sunita@homemade-tiffin.com',
        role: 'owner',
        is_verified: true,
      },
    });
    ownerUser.role = 'owner';
    ownerUser.name = 'Sunita Sharma';
    await ownerUser.save();

    // 2. Owner Profile
    let [ownerProfile] = await OwnerProfile.findOrCreate({
      where: { user_id: ownerUser.id },
      defaults: {
        user_id: ownerUser.id,
        business_name: 'Annapurna Homemade Tiffin & Meals',
        description: 'Authentic ghar ka khana made with pure desi ghee and fresh farm vegetables. Hygienic, healthy, and delivered warm.',
        address: 'Flat 302, Gokul Dham Apartments, Sector 14',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302020',
        latitude: 26.9124,
        longitude: 75.7873,
        service_radius_km: 7.5,
        delivery_available: true,
        pickup_available: true,
        opening_time: '08:00:00',
        closing_time: '21:30:00',
      },
    });

    // 3. Menu Items
    const menuItemsData = [
      {
        owner_id: ownerUser.id,
        name: 'Deluxe Full Tiffin',
        description: '4 Butter Rotis, Dal Tadka, Paneer Sabji, Seasonal Dry Veg, Steamed Rice, Salad & Sweet',
        category: 'Full Tiffin',
        price: 130,
        meal_type: 'lunch',
        serving_size: '1 Person',
        delivery_available: true,
        pickup_available: true,
      },
      {
        owner_id: ownerUser.id,
        name: 'Standard Daily Tiffin',
        description: '4 Whole Wheat Phulkas, Dal Fry, Seasonal Sabji, Jeera Rice, Pickle',
        category: 'Full Tiffin',
        price: 100,
        meal_type: 'lunch',
        serving_size: '1 Person',
        delivery_available: true,
        pickup_available: true,
      },
      {
        owner_id: ownerUser.id,
        name: 'Roti and Sabji Combo',
        description: '4 Hot Tawa Phulkas + Daily Special Homestyle Sabji',
        category: 'Roti and Sabji',
        price: 75,
        meal_type: 'lunch',
        serving_size: '1 Person',
        delivery_available: true,
        pickup_available: true,
      },
      {
        owner_id: ownerUser.id,
        name: 'Dal and Rice Bowl',
        description: 'Desi Ghee Dal Tadka served with fragrant Basmati Jeera Rice',
        category: 'Dal and Rice',
        price: 70,
        meal_type: 'dinner',
        serving_size: '1 Person',
        delivery_available: true,
        pickup_available: true,
      },
      {
        owner_id: ownerUser.id,
        name: 'Extra Phulka (Pack of 4)',
        description: 'Fresh, soft whole wheat phulkas brushed with pure cow ghee',
        category: 'Roti Only',
        price: 30,
        meal_type: 'lunch',
        serving_size: '4 pcs',
        delivery_available: true,
        pickup_available: true,
      },
      {
        owner_id: ownerUser.id,
        name: 'Special Gujarati Methi Thepla (Pack of 3)',
        description: 'Traditional spiced flatbread served with fresh curd & tangy pickle',
        category: 'Custom Tiffin',
        price: 60,
        meal_type: 'breakfast',
        serving_size: '3 pcs',
        delivery_available: true,
        pickup_available: true,
      },
    ];

    const createdMenuItems = [];
    for (const item of menuItemsData) {
      let [menuItem] = await MenuItem.findOrCreate({
        where: { owner_id: item.owner_id, name: item.name },
        defaults: item,
      });
      createdMenuItems.push(menuItem);
    }

    // 4. Subscription Plans
    const [monthlyPlan] = await SubscriptionPlan.findOrCreate({
      where: { owner_id: ownerUser.id, name: 'Monthly Deluxe Lunch Subscription' },
      defaults: {
        owner_id: ownerUser.id,
        name: 'Monthly Deluxe Lunch Subscription',
        description: 'Complete wholesome lunch tiffin 6 days a week (Mon-Sat). Free doorstep delivery.',
        plan_type: 'monthly',
        price: 2999,
        duration_days: 30,
        meals_per_day: 1,
        delivery_charges: 0,
        is_available: true,
      },
    });

    const [standardMonthly] = await SubscriptionPlan.findOrCreate({
      where: { owner_id: ownerUser.id, name: 'Monthly Standard Tiffin Plan' },
      defaults: {
        owner_id: ownerUser.id,
        name: 'Monthly Standard Tiffin Plan',
        description: 'Budget-friendly healthy homestyle meals everyday for 30 days.',
        plan_type: 'monthly',
        price: 2400,
        duration_days: 30,
        meals_per_day: 1,
        delivery_charges: 0,
        is_available: true,
      },
    });

    // Link plan items
    if (createdMenuItems.length > 0) {
      await PlanItem.findOrCreate({
        where: { plan_id: monthlyPlan.id, menu_item_id: createdMenuItems[0].id },
        defaults: { plan_id: monthlyPlan.id, menu_item_id: createdMenuItems[0].id, quantity: 1 },
      });
    }

    // 5. Create Customer User
    const [customerUser] = await User.findOrCreate({
      where: { phone: '+919123456789' },
      defaults: {
        phone: '+919123456789',
        name: 'Rahul Verma',
        email: 'rahul.verma@example.com',
        role: 'customer',
        is_verified: true,
      },
    });
    customerUser.role = 'customer';
    customerUser.name = 'Rahul Verma';
    await customerUser.save();

    await CustomerProfile.findOrCreate({
      where: { user_id: customerUser.id },
      defaults: {
        user_id: customerUser.id,
        address: 'B-14, IT Park Road, Malviya Nagar',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        delivery_address: 'Wing C, Tech Hub Campus, 4th Floor',
        food_preferences: 'No onion no garlic on Tuesdays. Less spicy preferred.',
      },
    });

    // 6. Active Subscription for Customer
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [subscription] = await Subscription.findOrCreate({
      where: { customer_id: customerUser.id, owner_id: ownerUser.id },
      defaults: {
        customer_id: customerUser.id,
        owner_id: ownerUser.id,
        plan_id: monthlyPlan.id,
        start_date: today,
        end_date: nextMonth,
        status: 'active',
        total_amount: 2999,
        paid_amount: 2999,
        remaining_days: 28,
      },
    });

    // 7. Sample Orders
    const [order1] = await Order.findOrCreate({
      where: { order_number: 'ORD-100234' },
      defaults: {
        order_number: 'ORD-100234',
        customer_id: customerUser.id,
        owner_id: ownerUser.id,
        order_type: 'daily',
        order_date: today,
        meal_timing: 'lunch',
        delivery_type: 'delivery',
        delivery_address: 'Wing C, Tech Hub Campus, 4th Floor',
        subtotal: 130,
        delivery_charges: 0,
        discount: 0,
        total_amount: 130,
        payment_status: 'paid',
        order_status: 'preparing',
        notes: 'Please provide extra green chutney.',
      },
    });

    await OrderItem.findOrCreate({
      where: { order_id: order1.id, menu_item_id: createdMenuItems[0].id },
      defaults: {
        order_id: order1.id,
        menu_item_id: createdMenuItems[0].id,
        item_name: createdMenuItems[0].name,
        quantity: 1,
        unit_price: 130,
        total_price: 130,
      },
    });

    // 8. Sample Payment
    await Payment.findOrCreate({
      where: { customer_id: customerUser.id, owner_id: ownerUser.id, amount: 2999 },
      defaults: {
        customer_id: customerUser.id,
        owner_id: ownerUser.id,
        subscription_id: subscription.id,
        amount: 2999,
        payment_method: 'upi',
        payment_purpose: 'subscription',
        payment_status: 'paid',
        payment_date: today,
        transaction_id: 'UPI98374928472',
        notes: 'Monthly subscription advance payment',
      },
    });

    console.log('✅ Demo Seed Data successfully inserted into database!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();

