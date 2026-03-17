
const e = require('cors');
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
 
    bio: {
      type: String,
      default: 'Hey there! I am using ChatStack.',
      maxlength: 500
    },
    
  
    avatarUrl: {
      type: String,
      default: null
    },
    

    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zipCode: { type: String, default: '' }
    },
    
  
    socialLinks: {
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      twitter: { type: String, default: '' },
      website: { type: String, default: '' }
    },

    headline: {
      type: String,
      default: '',
      maxlength: 120
    },
  
    skills: {
      type: [String],
      default: []
    },

    openToCollaboration: {
      type: Boolean,
      default: false
    },

    githubUsername: {
      type: String,
      default: ''
    },

    experience: [
      {
        company: { type: String, required: true },
        role: { type: String, required: true },
        startDate: { type: String },
        endDate: { type: String },
        description: { type: String, default: '' }
      }
    ],

    education: [
      {
        insitution: { type: String, required: true },
        degree: { type: String, required: true },
        fieldOfStudy: { type: String },
        startYear: { type: String },
        endYear: { type: String },
      }
    ],

    username: {
      type: String,
      default: '',
      index: true
    }
  },
  {
    timestamps: true
  }
);
module.exports = mongoose.model('Profile', profileSchema);