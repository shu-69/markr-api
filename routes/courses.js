const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');

// GET /courses/getCourses
router.get('/getCourses', async (req, res) => {
  try {
    const courses = await Course.find({});
    res.status(200).json({
      success: true,
      result: courses
    });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({
      success: false,
      err: 'Failed to fetch courses.'
    });
  }
});

// GET /courses/getEnrolled
router.get('/getEnrolled', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({
      success: false,
      err: 'userId query parameter is required.'
    });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        err: 'Invalid user ID format.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        err: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      result: user.enrolledCourses || []
    });
  } catch (err) {
    console.error('Error fetching enrolled courses:', err);
    res.status(500).json({
      success: false,
      err: 'Failed to fetch enrolled courses.'
    });
  }
});

// POST /courses/enroll
router.post('/enroll', async (req, res) => {
  const { userId, courseId, paymentId } = req.body;

  if (!userId || !courseId) {
    return res.status(400).json({
      success: false,
      err: 'Missing required fields: userId and courseId are required.'
    });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        err: 'Invalid user ID format.'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        err: 'User not found.'
      });
    }

    // Check if course is already enrolled
    if (!user.enrolledCourses) {
      user.enrolledCourses = [];
    }

    if (user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({
        success: false,
        err: 'User is already enrolled in this course.'
      });
    }

    // Add to enrolledCourses
    user.enrolledCourses.push(courseId);

    // Optional: Log paymentId into transactions
    if (paymentId) {
      if (!user.transactions) {
        user.transactions = [];
      }
      
      // Look up course details to enrich the transaction? Or just a basic one.
      // We'll create a simple transaction placeholder for now.
      user.transactions.push({
        razorpay_payment_id: paymentId,
        amount: 0, // Actual amount would ideally be passed or fetched, setting to 0 for fallback
        description: `Enrollment in Course: ${courseId}`,
        date: new Date(),
        status: 'success'
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in course!'
    });
  } catch (err) {
    console.error('Error enrolling in course:', err);
    res.status(500).json({
      success: false,
      err: 'Failed to enroll in course.'
    });
  }
});

module.exports = router;
