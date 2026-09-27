const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');

exports.getPublicEmergencyCard = async (req, res) => {
  try {
    const user = await User.findOne({ qrId: req.params.qrId });
    if (!user) return res.status(404).json({ message: 'Emergency card not found' });
    if (!user.publicEmergencyConsent) {
      return res.status(403).json({ message: 'The owner has not enabled public emergency-card sharing' });
    }

    const emergencyContacts = await EmergencyContact.find({ user: user._id })
      .select('name phone relation -_id');

    return res.status(200).json({
      fullName: user.fullName,
      phone: user.phone,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      medicalConditions: user.medicalConditions,
      vehicle: {
        type: user.vehicle?.type || '',
        registrationNumber: user.vehicle?.registrationNumber || '',
        makeModel: user.vehicle?.makeModel || '',
        color: user.vehicle?.color || '',
      },
      emergencyContacts,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};