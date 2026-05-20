const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

const TESTS = 'tests';
const PRACTICE_PAPERS = 'practice_papers';
const PARAMS = 'params';
const USERS = 'users';

function getCollection(db, examType) {
  if (examType === 'test') return db.collection(TESTS);
  if (examType === 'practice_paper') return db.collection(PRACTICE_PAPERS);
  return null;
}

// POST /exams/createTest
router.post('/createTest', async (req, res) => {
  const db = mongoose.connection.db;
  try {
    const result = await db.collection(TESTS).insertOne(req.body);
    res.json({ success: result.acknowledged, insertedId: result.insertedId });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// POST /exams/createPracticePaper
router.post('/createPracticePaper', async (req, res) => {
  const db = mongoose.connection.db;
  try {
    const result = await db.collection(PRACTICE_PAPERS).insertOne(req.body);
    res.json({ success: result.acknowledged, insertedId: result.insertedId });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// GET /exams/getTests
router.get('/getTests', async (req, res) => {
  const db = mongoose.connection.db;
  const docs = await db.collection(TESTS).find().toArray();
  docs.forEach(d => { d._id = d._id.toString(); });
  res.json(docs);
});

// GET /exams/getPracticePapers
router.get('/getPracticePapers', async (req, res) => {
  const db = mongoose.connection.db;
  const docs = await db.collection(PRACTICE_PAPERS).find().toArray();
  docs.forEach(d => { d._id = d._id.toString(); });
  res.json(docs);
});

// GET /exams/getActiveTests
router.get('/getActiveTests', async (req, res) => {
  const db = mongoose.connection.db;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const search = req.query.search || '';
  const sort = req.query.sort || '';

  try {
    const query = { isActive: true };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const sortOptions = {};
    if (sort === 'date') {
      sortOptions['details.added_on'] = -1;
    } else if (sort === 'title') {
      sortOptions.title = 1;
    } else if (sort === 'marks') {
      sortOptions.marks = -1;
    } else if (sort === 'time') {
      sortOptions.time = 1;
    }

    const total = await db.collection(TESTS).countDocuments(query);
    
    let cursor = db.collection(TESTS).find(query);
    
    if (Object.keys(sortOptions).length > 0) {
      cursor = cursor.sort(sortOptions);
    }
    
    const docs = await cursor.skip(skip).limit(limit).toArray();
    
    docs.forEach(d => { d._id = d._id.toString(); });
    
    res.json({
      success: true,
      result: docs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, err: err.message });
  }
});

// GET /exams/getActivePracticePapers
router.get('/getActivePracticePapers', async (req, res) => {
  const db = mongoose.connection.db;
  const docs = await db.collection(PRACTICE_PAPERS).find({ isActive: true }).toArray();
  docs.forEach(d => { d._id = d._id.toString(); });
  res.json(docs);
});

// POST /exams/toggleExamStatus
router.post('/toggleExamStatus', async (req, res) => {
  const { examType, examId, isActive } = req.query;
  const db = mongoose.connection.db;
  const collection = getCollection(db, examType);
  if (!collection) return res.json({ success: false, err: "examType must be 'test' or 'practice_paper'" });

  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(examId) },
      { $set: { isActive: isActive === 'true' } }
    );
    res.json({ success: result.acknowledged, result });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// GET /exams/getExam
router.get('/getExam', async (req, res) => {
  const { examType, examId } = req.query;
  const db = mongoose.connection.db;
  const collection = getCollection(db, examType);
  if (!collection) return res.json({ success: false, err: "examType must be 'test' or 'practice_paper'" });

  try {
    const doc = await collection.findOne({ _id: new ObjectId(examId) });
    if (!doc) return res.json({ success: false, err: 'No document found with this id' });
    doc._id = doc._id.toString();
    res.json({ success: true, result: doc });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// POST /exams/updateExam
router.post('/updateExam', async (req, res) => {
  const { examType, examId } = req.query;
  const db = mongoose.connection.db;
  const collection = getCollection(db, examType);
  if (!collection) return res.json({ success: false, err: "examType must be 'test' or 'practice_paper'" });

  try {
    const result = await collection.updateOne(
      { _id: new ObjectId(examId) },
      { $set: req.body }
    );
    res.json({ success: result.acknowledged, result });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// DELETE /exams/deleteExam
router.delete('/deleteExam', async (req, res) => {
  const { examType, examId } = req.query;
  const db = mongoose.connection.db;
  const collection = getCollection(db, examType);
  if (!collection) return res.json({ success: false, err: "examType must be 'test' or 'practice_paper'" });

  try {
    const result = await collection.deleteOne({ _id: new ObjectId(examId) });
    res.json({ success: result.acknowledged, result });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// GET /exams/getExamInstructions
router.get('/getExamInstructions', async (req, res) => {
  const { examType } = req.query;
  const db = mongoose.connection.db;

  try {
    const doc = await db.collection(PARAMS).findOne({});
    const instructions = doc?.exam_instructions?.[examType];
    if (instructions == null) return res.json({ success: false, err: 'Instructions not found' });
    res.json({ success: true, result: instructions });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// POST /exams/submitExam
router.post('/submitExam', async (req, res) => {
  const { examType, examId } = req.query;
  const db = mongoose.connection.db;
  const collection = getCollection(db, examType);
  if (!collection) return res.json({ success: false, err: "examType must be 'test' or 'practice_paper'" });

  try {
    const submission = { ...req.body, _id: new ObjectId() };

    // Ensure submissions array exists
    await collection.updateOne(
      { _id: new ObjectId(examId), submissions: { $exists: false } },
      { $set: { submissions: [] } }
    );

    const result = await collection.updateOne(
      { _id: new ObjectId(examId) },
      { $push: { submissions: submission } }
    );

    if (!result.acknowledged) return res.json({ success: false });

    // Add to student profile
    const studentResult = await addSubmissionToStudentProfile(db, req.body?.submittedBy?.email, submission);

    res.json({
      success: true,
      result,
      submissionId: submission._id.toHexString(),
      studentProfileSubmissionResult: studentResult
    });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// GET /exams/getSubmission
router.get('/getSubmission', async (req, res) => {
  const { examType, examId, submissionId } = req.query;
  const db = mongoose.connection.db;
  const collection = getCollection(db, examType);
  if (!collection) return res.json({ success: false, err: "examType must be 'test' or 'practice_paper'" });

  try {
    const doc = await collection.findOne({ _id: new ObjectId(examId) });
    if (!doc) return res.json({ success: false, err: 'No document found' });

    const submission = (doc.submissions || []).find(s => s._id.toString() === submissionId);
    if (!submission) return res.json({ success: false, err: 'Submission not found' });

    submission._id = submission._id.toString();
    res.json({ success: true, result: submission });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// GET /exams/getExamSubmissions
router.get('/getExamSubmissions', async (req, res) => {
  const { examType, examId } = req.query;
  const db = mongoose.connection.db;
  const collection = getCollection(db, examType);
  if (!collection) return res.json({ success: false, err: "examType must be 'test' or 'practice_paper'" });

  try {
    const doc = await collection.findOne({ _id: new ObjectId(examId) });
    if (!doc) return res.json({ success: false, err: 'No document found' });

    const submissions = (doc.submissions || []).map(s => ({ ...s, _id: s._id.toString() }));
    res.json({ success: true, result: submissions });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

// GET /exams/checkSubmissionExists
router.get('/checkSubmissionExists', async (req, res) => {
  const { email, examId } = req.query;
  const db = mongoose.connection.db;

  try {
    const doc = await db.collection(USERS).findOne({ email });
    const submissions = doc?.submissions || [];
    const exists = submissions.some(s => s?.examDetails?.examId === examId);
    res.json({ success: true, result: exists });
  } catch (err) {
    res.json({ success: false, err: err.message });
  }
});

async function addSubmissionToStudentProfile(db, email, submission) {
  try {
    const submissionWithStr = { ...submission, idStr: submission._id.toHexString() };

    await db.collection(USERS).updateOne(
      { email, submissions: { $exists: false } },
      { $set: { submissions: [] } }
    );

    const result = await db.collection(USERS).updateOne(
      { email },
      { $push: { submissions: submissionWithStr } }
    );

    // Calculate marks and award points/badges
    let marksObtained = 0;
    const isNegativeMarking = submission.examDetails?.negativeMarking;

    if (submission.questions && Array.isArray(submission.questions)) {
      submission.questions.forEach((element) => {
        if (element.user_ans) {
          let isCorrect = false;
          switch (element.answer_type) {
            case 'options':
              isCorrect = (element.user_ans == element.answer_content?.correct_answer);
              break;
            case 'boolean':
              isCorrect = (element.user_ans.toString().toLowerCase() == element.answer_content?.correct_answer?.toString().toLowerCase());
              break;
            case 'oneword':
              isCorrect = (element.user_ans.toLowerCase() == element.answer_content?.correct_answer?.toLowerCase());
              break;
          }

          if (isCorrect) {
            marksObtained += (element.marks?.positive || 0);
          } else if (isNegativeMarking && element.marks?.negative) {
            let neg = element.marks.negative < 0 ? element.marks.negative * -1 : element.marks.negative;
            marksObtained -= neg;
          }
        }
      });
    }

    marksObtained = Math.max(0, marksObtained); // Don't give negative total points

    // Update user points
    await db.collection(USERS).updateOne(
      { email },
      { $inc: { points: marksObtained } }
    );

    // Check for badges
    const userDoc = await db.collection(USERS).findOne({ email });
    const currentPoints = userDoc?.points || 0;
    const currentBadges = userDoc?.badges || [];
    const newBadges = [];

    // Badge logic
    const hasBadge = (name) => currentBadges.some(b => b.name === name);

    if (currentPoints >= 100 && !hasBadge('Centurion')) {
      newBadges.push({ name: 'Centurion', icon: 'fa-star', dateAwarded: new Date() });
    }
    if (marksObtained >= (submission.examDetails?.totalMarks || 100) && !hasBadge('Perfect Score')) {
      newBadges.push({ name: 'Perfect Score', icon: 'fa-trophy', dateAwarded: new Date() });
    }
    if (submission.questions && submission.questions.length > 0 && !hasBadge('First Exam Completed')) {
      newBadges.push({ name: 'First Exam Completed', icon: 'fa-medal', dateAwarded: new Date() });
    }

    if (newBadges.length > 0) {
      await db.collection(USERS).updateOne(
        { email },
        { $push: { badges: { $each: newBadges } } }
      );
    }

    return { success: result.acknowledged, submissionId: submission._id.toHexString() };
  } catch (err) {
    return { success: false, err: err.message };
  }
}

module.exports = router;
