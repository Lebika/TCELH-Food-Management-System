const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;
const uri = 'mongodb://localhost:27017/hostel_db';

// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Define Slot Schema and Model
const slotSchemaHostel1 = new mongoose.Schema({
  date: String,       // Date in the format "YYYY-MM-DD"
  morning: Number,    // Available slots in the morning
  afternoon: Number,  // Available slots in the afternoon
  evening: Number,    // Available slots in the evening
  night: Number       // Available slots in the night
});

const SlotHostel1 = mongoose.model('SlotHostel1',slotSchemaHostel1 );

const bookingSchemaHostel2 = new mongoose.Schema({
  mailid: String,
  startdate: Date,
  startslot: String,
  enddate: Date,
  endslot: String
});
const slotSchemaHostel2 = new mongoose.Schema({
  date: String,
  morning: { type: Number, default: 600 },
  afternoon: { type: Number, default: 600 },
  evening: { type: Number, default: 600 },
  night: { type: Number, default: 600 }
});

const SlotHostel2 = mongoose.model('SlotHostel2', slotSchemaHostel2);

// Hostel 3
const bookingSchemaHostel3 = new mongoose.Schema({
  mailid: String,
  startdate: Date,
  startslot: String,
  enddate: Date,
  endslot: String
});
const slotSchemaHostel3 = new mongoose.Schema({
  date: String,
  morning: { type: Number, default: 450 },
  afternoon: { type: Number, default: 450 },
  evening: { type: Number, default: 450 },
  night: { type: Number, default: 450 }
});
const SlotHostel3 = mongoose.model('SlotHostel3', slotSchemaHostel3);


app.post('/api/loginA', async (req, res) => {
  const { mailid, mailpassword } = req.body;
  try {
    console.log('Login attempt with email:', mailid);
    const user = await mongoose.connection.collection('adminlogin').findOne({ mailid, mailpassword });
    if (user) {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Error during login' });
  }
});
//

// Define a utility function to get start and end of the month for the selected month and year
function getMonthRange(month, year) {
  const startOfMonth = new Date(year, month - 1, 1); // Months are 0-indexed in JavaScript
  const endOfMonth = new Date(year, month, 0);
  const startStr = startOfMonth.toISOString().split('T')[0];
  const endStr = endOfMonth.toISOString().split('T')[0];
  return { startStr, endStr };
}

// Utility function to get start and end of the selected month and year
function getMonthRange(month, year) {
  const startOfMonth = new Date(year, month - 1, 1); // Start of the selected month
  const endOfMonth = new Date(year, month, 0); // End of the selected month

  // Format both dates to exclude time and only include YYYY-MM-DD
  const startStr = startOfMonth.toISOString().split('T')[0];
  const endStr = endOfMonth.toISOString().split('T')[0];
  
  return { startStr, endStr };
}

app.get('/api/slothostel1', async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Get the start and end dates of the selected month
    const { startStr, endStr } = getMonthRange(month, year);

    // Query the database to fetch slots only for the selected month
    const slots = await SlotHostel1.find({
      date: { $gte: startStr, $lte: endStr }  // Ensure date is within the selected month
    });

    res.json(slots);
  } catch (error) {
    console.error('Error fetching slots data:', error);
    res.status(500).json({ message: 'Error fetching slots data' });
  }
});

app.get('/api/slothostel2', async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Get the start and end dates of the selected month
    const { startStr, endStr } = getMonthRange(month, year);

    // Query the database to fetch slots only for the selected month
    const slots = await SlotHostel2.find({
      date: { $gte: startStr, $lte: endStr }
    });

    res.json(slots);
  } catch (error) {
    console.error('Error fetching slots data:', error);
    res.status(500).json({ message: 'Error fetching slots data' });
  }
});

app.get('/api/slothostel3', async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Get the start and end dates of the selected month
    const { startStr, endStr } = getMonthRange(month, year);

    // Query the database to fetch slots only for the selected month
    const slots = await SlotHostel3.find({
      date: { $gte: startStr, $lte: endStr }
    });

    res.json(slots);
  } catch (error) {
    console.error('Error fetching slots data:', error);
    res.status(500).json({ message: 'Error fetching slots data' });
  }
});
// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
