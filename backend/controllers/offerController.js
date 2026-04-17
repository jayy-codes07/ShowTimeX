const Offer = require('../models/Offer');

// Create Offer
exports.createOffer = async (req, res) => {
  try {
    const offer = new Offer({
      ...req.body,
      createdBy: req.user._id,
    });

    await offer.save();
    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: offer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Offers
exports.getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate('createdBy', 'name email')
      .populate('applicableMovies', 'title')
      .populate('applicableShows');

    res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Active Offers
exports.getActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      isActive: true,
      validFrom: { $lte: now },
      validUpto: { $gte: now },
    })
      .populate('applicableMovies', 'title')
      .populate('applicableShows');

    res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Offer by ID
exports.getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('applicableMovies', 'title')
      .populate('applicableShows');

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Offer by Code
exports.getOfferByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const offer = await Offer.findOne({ discountCode: code.toUpperCase() });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    if (!offer.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Offer has expired or is not active',
      });
    }

    res.status(200).json({
      success: true,
      data: offer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Offer
exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer updated successfully',
      data: offer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Validate Offer for User
exports.validateOfferForUser = async (req, res) => {
  try {
    const { code, amount } = req.body;
    const userId = req.user._id;

    const offer = await Offer.findOne({ discountCode: code.toUpperCase() });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    if (!offer.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Offer has expired or is not active',
      });
    }

    if (!offer.canUserUseOffer(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You have already used this offer maximum times',
      });
    }

    const discount = offer.calculateDiscount(amount);

    res.status(200).json({
      success: true,
      data: {
        offerId: offer._id,
        discountCode: offer.discountCode,
        discountValue: offer.discountValue,
        discountType: offer.discountType,
        discountAmount: discount,
        finalAmount: amount - discount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Offer
exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
