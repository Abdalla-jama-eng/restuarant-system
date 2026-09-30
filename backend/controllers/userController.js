const User = require('../models/User');

// @desc Get all users
// @route GET /api/users
// @access Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a user (Cashier or Admin)
// @route POST /api/users
// @access Private/Admin
const createUser = async (req, res) => {
  try {
    const { username, password, name, role, phone } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ message: 'Username, password and name are required' });
    }

    const userExists = await User.findOne({ username: username.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const user = await User.create({
      username: username.toLowerCase().trim(),
      password,
      name,
      role: role || 'cashier',
      phone: phone || '',
      active: true,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      phone: user.phone,
      active: user.active,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update user
// @route PUT /api/users/:id
// @access Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.role = req.body.role || user.role;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    if (req.body.active !== undefined) {
      user.active = req.body.active;
    }

    if (req.body.password && req.body.password.trim() !== '') {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      role: updatedUser.role,
      phone: updatedUser.phone,
      active: updatedUser.active,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete user
// @route DELETE /api/users/:id
// @access Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the currently logged in admin user
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Toggle active status
// @route PATCH /api/users/:id/toggle-status
// @access Private/Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate yourself' });
    }

    user.active = !user.active;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      active: user.active,
      message: `User ${user.active ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, toggleUserStatus };
