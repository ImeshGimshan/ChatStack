const Profile = require("../models/Profile.model");
const axios = require("axios");

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:8080";

//fwtch user details from auth service
async function fetchUserFromAuthService(userId, token) {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user from Auth Service:", error.message);
    return null;
  }
}
//get current user's profile from userId in token
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const token = req.headers.authorization?.split(" ")[1];

    // Find profile in MongoDB
    let profile = await Profile.findOne({ userId }).lean();

    // If profile doesn't exist, create a basic one
    if (!profile) {
      console.log(`📝 Creating new profile for user ${userId}`);

      profile = await Profile.create({ userId });
      profile = profile.toObject();

      console.log(`✅ Profile created for user ${userId}`);
    }

    // Fetch username and email from Auth Service
    const authUser = await fetchUserFromAuthService(userId, token);

    if (authUser?.username && profile.username !== authUser.username) {
      await Profile.updateOne(
        { userId },
        { $set: { username: authUser.username } },
      );
      profile.username = authUser.username;
    }

    const completeProfile = {
      userId: profile.userId,
      username: authUser?.username || profile.username || `user_${userId}`,
      email: authUser?.email || "",
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      headline: profile.headline,
      skills: profile.skills,
      openToWork: profile.openToWork,
      githubUsername: profile.githubUsername,
      experience: profile.experience,
      education: profile.education,
      address: profile.address,
      socialLinks: profile.socialLinks,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    res.json(completeProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch profile",
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const updates = req.body;

    // Only allow these fields to be updated
    const allowedFields = [
      "bio",
      "avatarUrl",
      "address",
      "socialLinks",
      "headline",
      "skills",
      "openToWork",
      "githubUsername",
      "experience",
      "education",
    ];
    const filteredUpdates = {};

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Prevent updating protected fields
    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        error: "Bad Request",
        message:
          "No valid fields to update. Allowed fields: bio, avatarUrl, address, socialLinks",
      });
    }

    // Find and update profile
    let profile = await Profile.findOneAndUpdate(
      { userId },
      { $set: filteredUpdates },
      {
        new: true,
        runValidators: true,
        upsert: true, // Create if doesn't exist
      },
    ).lean();

    console.log(`✅ Profile updated for user ${userId}`);

    // Fetch username and email from Auth Service
    const token = req.headers.authorization?.split(" ")[1];
    const authUser = await fetchUserFromAuthService(userId, token);

    // Return complete profile
    const completeProfile = {
      userId: profile.userId,
      username: authUser?.username || `user_${userId}`,
      email: authUser?.email || "",
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      address: profile.address,
      socialLinks: profile.socialLinks,
      updatedAt: profile.updatedAt,
    };

    res.json({
      message: "Profile updated successfully",
      profile: completeProfile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation Error",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update profile",
    });
  }
};

//get profile by userId
exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestToken = req.headers.authorization?.split(" ")[1];

    // Find profile in MongoDB
    const profile = await Profile.findOne({
      userId: parseInt(userId),
    }).lean();

    if (!profile) {
      return res.status(404).json({
        error: "Not Found",
        message: "Profile not found",
      });
    }

    const authUser = await fetchUserFromAuthService(
      parseInt(userId),
      requestToken,
    );

    // Return complete profile
    const completeProfile = {
      userId: profile.userId,
      username: authUser?.username || `user_${userId}`,
      email: authUser?.email || "",
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      address: profile.address,
      socialLinks: profile.socialLinks,
    };

    res.json(completeProfile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch profile",
    });
  }
};
//create profile for current user
exports.createMyProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const payload = req.body || {};

    // Check if profile already exists
    const existing = await Profile.findOne({ userId }).lean();
    if (existing) {
      return res.status(409).json({
        error: "Conflict",
        message: "Profile already exists for this user",
      });
    }

    // Only allow these fields to be set on creation
    const allowedFields = ["bio", "avatarUrl", "address", "socialLinks"];
    const doc = { userId };
    allowedFields.forEach((f) => {
      if (payload[f] !== undefined) doc[f] = payload[f];
    });

    const created = await Profile.create(doc);

    // Fetch username/email from auth service if possible
    const token = req.headers.authorization?.split(" ")[1];
    const authUser = await fetchUserFromAuthService(userId, token);

    const completeProfile = {
      userId: created.userId,
      username: authUser?.username || `user_${userId}`,
      email: authUser?.email || "",
      bio: created.bio,
      avatarUrl: created.avatarUrl,
      address: created.address,
      socialLinks: created.socialLinks,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };

    res.status(201).json({
      message: "Profile created",
      profile: completeProfile,
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create profile' });
  }
};

// GET /api/profile/search?username=imesh
exports.searchUsers = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ error: 'Bad Request', message: 'username query param is required' });
    }

    const profiles = await Profile.find({
      username: { $regex: username, $options: 'i' }
    }).select('userId username headline avatarUrl skills openToCollaboration').lean();

    res.json(profiles);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Search failed' });
  }
};

// GET /api/profile/discover?page=1&limit=20
exports.discoverProfiles = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      Profile.find({})
        .select('userId username headline avatarUrl skills openToCollaboration')
        .skip(skip)
        .limit(limit)
        .lean(),
      Profile.countDocuments()
    ]);

    res.json({ profiles, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error discovering profiles:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Discovery failed' });
  }
};
