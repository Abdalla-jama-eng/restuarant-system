const Table = require('../models/Table');
const Order = require('../models/Order');

// @desc Get all tables
// @route GET /api/tables
// @access Private
const getTables = async (req, res) => {
  try {
    const tables = await Table.find({}).populate('currentOrderId').sort({ tableNumber: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create table
// @route POST /api/tables
// @access Private/Admin
const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, notes } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ message: 'Table number/name is required' });
    }

    const exists = await Table.findOne({ tableNumber: tableNumber.trim() });
    if (exists) {
      return res.status(400).json({ message: 'Table number already exists' });
    }

    const table = await Table.create({
      tableNumber: tableNumber.trim(),
      capacity: capacity ? Number(capacity) : 4,
      notes: notes || '',
      status: 'available',
    });

    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update table
// @route PUT /api/tables/:id
// @access Private/Admin
const updateTable = async (req, res) => {
  try {
    const { tableNumber, capacity, notes, status, reservedBy, reservationTime } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (tableNumber) table.tableNumber = tableNumber.trim();
    if (capacity !== undefined) table.capacity = Number(capacity);
    if (notes !== undefined) table.notes = notes;
    if (status !== undefined) table.status = status;
    if (reservedBy !== undefined) table.reservedBy = reservedBy;
    if (reservationTime !== undefined) table.reservationTime = reservationTime;

    const updated = await table.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete table
// @route DELETE /api/tables/:id
// @access Private/Admin
const deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (table.status === 'occupied') {
      return res.status(400).json({ message: 'Cannot delete an occupied table' });
    }

    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update table status (e.g. reserve / clean)
// @route PATCH /api/tables/:id/status
// @access Private
const updateTableStatus = async (req, res) => {
  try {
    const { status, reservedBy, reservationTime, currentGuests } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    if (status) table.status = status;
    if (reservedBy !== undefined) table.reservedBy = reservedBy;
    if (reservationTime !== undefined) table.reservationTime = reservationTime;
    if (currentGuests !== undefined) table.currentGuests = currentGuests;

    if (status === 'available') {
      table.currentOrderId = null;
      table.reservedBy = '';
      table.reservationTime = null;
      table.currentGuests = 0;
    }

    const updated = await table.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTables, createTable, updateTable, deleteTable, updateTableStatus };
