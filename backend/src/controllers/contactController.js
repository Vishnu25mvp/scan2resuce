const EmergencyContact = require('../models/EmergencyContact');

const getContacts = async (req, res) => {
  const contacts = await EmergencyContact.find({ user: req.user._id })
    .select('name phone relation')
    .sort({ createdAt: 1 });

  return res.status(200).json({ contacts });
};

const createContact = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  const relation = String(req.body.relation || '').trim();

  if (!name || !phone || !relation) {
    return res.status(400).json({ message: 'Name, phone, and relation are required' });
  }

  const contact = await EmergencyContact.create({
    user: req.user._id,
    name,
    phone,
    relation,
  });

  return res.status(201).json({ contact });
};

const deleteContact = async (req, res) => {
  const contact = await EmergencyContact.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!contact) {
    return res.status(404).json({ message: 'Emergency contact not found' });
  }

  return res.status(204).send();
};

module.exports = { getContacts, createContact, deleteContact };
