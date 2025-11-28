const express = require("express");
const yup = require("yup");
const { UserProfile } = require("../models");
const { authenticateToken } = require("./auth");

const router = express.Router();

const STATE_CODES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM",
  "NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
  "WV","WI","WY"
];

const availabilityValidator = yup
  .string()
  .test("is-date", "Availability dates must be valid dates", (value) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  });

const profileSchema = yup.object({
  fullName: yup.string().max(50).required(),
  address1: yup.string().max(100).required(),
  address2: yup.string().max(100).nullable(),
  city: yup.string().max(100).required(),
  state: yup.string().oneOf(STATE_CODES).required(),
  zip: yup
    .string()
    .matches(/^\d{5}(\d{4})?$/, "Zip code must be 5 or 9 digits")
    .required(),
  skills: yup.array().of(yup.string().max(100)).min(1).required(),
  preferences: yup.string().max(1000).nullable(),
  availability: yup.array().of(availabilityValidator).min(1).required(),
});

// No longer needed - using JWT authentication from auth.js
// const requireUser = (req, res, next) => {
//   const userId = Number(req.header("x-user-id"));
//   if (!userId) {
//     return res.status(401).json({ error: "x-user-id header is required" });
//   }
//   req.userId = userId;
//   return next();
// };

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
};

router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub; // Get user ID from JWT token
    const profile = await UserProfile.findOne({
      where: { userId },
    });
    
    // Return null if profile doesn't exist
    if (!profile) {
      return res.json(null);
    }
    
    return res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.sub; // Get user ID from JWT token
  
  const payload = {
    ...req.body,
    address2: req.body.address2 || null,
    preferences: req.body.preferences || null,
    skills: toArray(req.body.skills).filter(Boolean),
    availability: toArray(req.body.availability).filter(Boolean),
  };

  try {
    const data = await profileSchema.validate(payload, { abortEarly: false });
    
    // Use findOne + create/update instead of upsert for better error handling
    const existingProfile = await UserProfile.findOne({
      where: { userId },
    });

    let profile;
    if (existingProfile) {
      // Update existing profile
      await existingProfile.update(data);
      profile = existingProfile;
    } else {
      // Create new profile
      profile = await UserProfile.create({
        userId,
        ...data,
      });
    }
    
    return res.json(profile);
  } catch (error) {
    console.error("Error saving profile:", error);
    if (error instanceof yup.ValidationError) {
      return res.status(400).json({ errors: error.errors });
    }
    return res.status(500).json({ 
      error: "Failed to save profile",
      details: error.message 
    });
  }
});

module.exports = router;

