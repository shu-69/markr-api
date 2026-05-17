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

  try {
    const total = await db.collection(TESTS).countDocuments({ isActive: true });
    const docs = await db.collection(TESTS).find({ isActive: true }).skip(skip).limit(limit).toArray();
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

    return { success: result.acknowledged, submissionId: submission._id.toHexString() };
  } catch (err) {
    return { success: false, err: err.message };
  }
}

module.exports = router;
