const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

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

// Define Schemas and Models
const bookingSchema = new mongoose.Schema({
  mailid: String,
  startdate: Date,
  startslot: String,
  enddate: Date,
  endslot: String
});

const slotSchema = new mongoose.Schema({
  date: String,
  morning: { type: Number, default: 507 },
  afternoon: { type: Number, default: 507 },
  evening: { type: Number, default: 507 },
  night: { type: Number, default: 507 }
});

const BookingHostel1 = mongoose.model('BookingHostel1', bookingSchema);
const SlotHostel1 = mongoose.model('SlotHostel1', slotSchema);

//other hostel

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
const BookingHostel2 = mongoose.model('BookingHostel2', bookingSchemaHostel2);
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
const BookingHostel3 = mongoose.model('BookingHostel3', bookingSchemaHostel3, 'bookinghostel3');
const SlotHostel3 = mongoose.model('SlotHostel3', slotSchemaHostel3, 'slothostel3');


// Helper function to decrement slots
async function decrementSlots(result, slots) {
  slots.forEach(slot => {
    if (result[slot] > 0) {
      result[slot] -= 1;
    }
  });
  await result.save();
}

// Handle login request
app.post('/api/login', async (req, res) => {
  const { mailid, mailpassword } = req.body;
  try {
    console.log('Login attempt with email:', mailid);
    const user = await mongoose.connection.collection('MH_students').findOne({ mailid, mailpassword });
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

// Handle login request
app.post('/api/loginT', async (req, res) => {
  const { mailid, mailpassword } = req.body;
  try {
    console.log('Login attempt with email:', mailid);
    const user = await mongoose.connection.collection('TH_students').findOne({ mailid, mailpassword });
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

// Handle login request
app.post('/api/loginN', async (req, res) => {
  const { mailid, mailpassword } = req.body;
  try {
    console.log('Login attempt with email:', mailid);
    const user = await mongoose.connection.collection('NH_students').findOne({ mailid, mailpassword });
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

// Handle booking request
app.post('/submit', async (req, res) => {
  try {
    const { mailid, startdate, startslot, enddate, endslot } = req.body;
    const totalStrength = 507;

    // Use bookinghostel1 collection instead of bookings
    const booking = new BookingHostel1({
      mailid,
      startdate: new Date(startdate),
      startslot,
      enddate: new Date(enddate),
      endslot
    });

    // Save booking to the bookinghostel1 collection
    await booking.save();

    // Convert dates to UTC and initialize slot counts
    let currentDate = new Date(startdate);
    currentDate.setUTCHours(0, 0, 0, 0);
    const endDateObj = new Date(enddate);
    endDateObj.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endDateObj) {
      let dateStr = currentDate.toISOString().split('T')[0];

      // Use slothostel1 collection instead of slots
      let slotDoc = await SlotHostel1.findOne({ date: dateStr });

      if (!slotDoc) {
        // Initialize new slot document if not found
        slotDoc = new SlotHostel1({ date: dateStr });
      }

      // Decrement slot counts based on booking data
      if (currentDate.toISOString() === new Date(startdate).toISOString()) {
        // Start date: decrement from start slot to the end of the day
        const slotsToDecrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          ['morning', 'afternoon', 'evening', 'night'].indexOf(startslot)
        );
        await decrementSlots(slotDoc, slotsToDecrement);
      } else if (currentDate.toISOString() === new Date(enddate).toISOString()) {
        // End date: decrement from the beginning of the day to the end slot
        const slotsToDecrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          0,
          ['morning', 'afternoon', 'evening', 'night'].indexOf(endslot) + 1
        );
        await decrementSlots(slotDoc, slotsToDecrement);
      } else {
        // Middle dates: decrement all slots
        await decrementSlots(slotDoc, ['morning', 'afternoon', 'evening', 'night']);
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    res.sendFile(path.join(__dirname, 'public', 'submit_display.html'));
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).send('Error saving data');
  }
});



// Helper function to increment slots
async function incrementSlots(result, slots) {
  slots.forEach(slot => {
    result[slot] += 1;  // Add back one slot
  });
  await result.save();
}

// Handle edit request for Hostel 2 (adding back slots)
app.post('/edit', async (req, res) => {
  try {
    const { mailid, startdate, startslot, enddate, endslot } = req.body;
    
    // Convert dates to UTC and initialize slot counts
    let currentDate = new Date(startdate);
    currentDate.setUTCHours(0, 0, 0, 0);
    const endDateObj = new Date(enddate);
    endDateObj.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endDateObj) {
      let dateStr = currentDate.toISOString().split('T')[0];
      let slotDoc = await SlotHostel1.findOne({ date: dateStr });

      if (!slotDoc) {
        // Initialize new slot document if not found
        slotDoc = new SlotHostel1({ date: dateStr });
      }

      // Increment slot counts based on booking data
      if (currentDate.toISOString() === new Date(startdate).toISOString()) {
        // Start date: increment from start slot to the end of the day
        const slotsToIncrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          ['morning', 'afternoon', 'evening', 'night'].indexOf(startslot)
        );
        await incrementSlots(slotDoc, slotsToIncrement);
      } else if (currentDate.toISOString() === new Date(enddate).toISOString()) {
        // End date: increment from the beginning of the day to the end slot
        const slotsToIncrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          0,
          ['morning', 'afternoon', 'evening', 'night'].indexOf(endslot) + 1
        );
        await incrementSlots(slotDoc, slotsToIncrement);
      } else {
        // Middle dates: increment all slots
        await incrementSlots(slotDoc, ['morning', 'afternoon', 'evening', 'night']);
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    res.sendFile(path.join(__dirname, 'public', 'edit_display.html')); // Confirmation page
  } catch (err) {
    console.error('Error updating slots:', err);
    res.status(500).send('Error updating slots');
  }
});


//2-T


// Handle booking request for Hostel 2
app.post('/submitT', async (req, res) => {
  try {
    const { mailid, startdate, startslot, enddate, endslot } = req.body;
    const totalStrength = 600;

    // Create new booking for Hostel 2
    const booking = new BookingHostel2({
      mailid,
      startdate: new Date(startdate),
      startslot,
      enddate: new Date(enddate),
      endslot
    });

    // Save booking to the database
    await booking.save();

    // Convert dates to UTC and initialize slot counts
    let currentDate = new Date(startdate);
    currentDate.setUTCHours(0, 0, 0, 0);
    const endDateObj = new Date(enddate);
    endDateObj.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endDateObj) {
      let dateStr = currentDate.toISOString().split('T')[0];
      let slotDoc = await SlotHostel2.findOne({ date: dateStr });

      if (!slotDoc) {
        // Initialize new slot document if not found
        slotDoc = new SlotHostel2({ date: dateStr });
      }

      // Decrement slot counts based on booking data
      if (currentDate.toISOString() === new Date(startdate).toISOString()) {
        // Start date: decrement from start slot to the end of the day
        const slotsToDecrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          ['morning', 'afternoon', 'evening', 'night'].indexOf(startslot)
        );
        await decrementSlots(slotDoc, slotsToDecrement);
      } else if (currentDate.toISOString() === new Date(enddate).toISOString()) {
        // End date: decrement from the beginning of the day to the end slot
        const slotsToDecrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          0,
          ['morning', 'afternoon', 'evening', 'night'].indexOf(endslot) + 1
        );
        await decrementSlots(slotDoc, slotsToDecrement);
      } else {
        // Middle dates: decrement all slots
        await decrementSlots(slotDoc, ['morning', 'afternoon', 'evening', 'night']);
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    res.sendFile(path.join(__dirname, 'public', 'submit_display.html'));
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).send('Error saving data');
  }
});

// Handle edit request for Hostel 2 (adding back slots)
app.post('/editT', async (req, res) => {
  try {
    const { mailid, startdate, startslot, enddate, endslot } = req.body;
    
    // Convert dates to UTC and initialize slot counts
    let currentDate = new Date(startdate);
    currentDate.setUTCHours(0, 0, 0, 0);
    const endDateObj = new Date(enddate);
    endDateObj.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endDateObj) {
      let dateStr = currentDate.toISOString().split('T')[0];
      let slotDoc = await SlotHostel2.findOne({ date: dateStr });

      if (!slotDoc) {
        // Initialize new slot document if not found
        slotDoc = new SlotHostel2({ date: dateStr });
      }

      // Increment slot counts based on booking data
      if (currentDate.toISOString() === new Date(startdate).toISOString()) {
        // Start date: increment from start slot to the end of the day
        const slotsToIncrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          ['morning', 'afternoon', 'evening', 'night'].indexOf(startslot)
        );
        await incrementSlots(slotDoc, slotsToIncrement);
      } else if (currentDate.toISOString() === new Date(enddate).toISOString()) {
        // End date: increment from the beginning of the day to the end slot
        const slotsToIncrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          0,
          ['morning', 'afternoon', 'evening', 'night'].indexOf(endslot) + 1
        );
        await incrementSlots(slotDoc, slotsToIncrement);
      } else {
        // Middle dates: increment all slots
        await incrementSlots(slotDoc, ['morning', 'afternoon', 'evening', 'night']);
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    res.sendFile(path.join(__dirname, 'public', 'edit_display.html')); // Confirmation page
  } catch (err) {
    console.error('Error updating slots:', err);
    res.status(500).send('Error updating slots');
  }
});



//3-N
// Handle booking request for Hostel 3
app.post('/submitN', async (req, res) => {
  try {
    const { mailid, startdate, startslot, enddate, endslot } = req.body;
    const totalStrength = 450;

    // Create new booking for Hostel 3
    const booking = new BookingHostel3({
      mailid,
      startdate: new Date(startdate),
      startslot,
      enddate: new Date(enddate),
      endslot
    });

    // Save booking to the database
    await booking.save();

    // Convert dates to UTC and initialize slot counts
    let currentDate = new Date(startdate);
    currentDate.setUTCHours(0, 0, 0, 0);
    const endDateObj = new Date(enddate);
    endDateObj.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endDateObj) {
      let dateStr = currentDate.toISOString().split('T')[0];
      let slotDoc = await SlotHostel3.findOne({ date: dateStr });

      if (!slotDoc) {
        // Initialize new slot document if not found
        slotDoc = new SlotHostel3({ date: dateStr });
      }

      // Decrement slot counts based on booking data
      if (currentDate.toISOString() === new Date(startdate).toISOString()) {
        // Start date: decrement from start slot to the end of the day
        const slotsToDecrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          ['morning', 'afternoon', 'evening', 'night'].indexOf(startslot)
        );
        await decrementSlots(slotDoc, slotsToDecrement);
      } else if (currentDate.toISOString() === new Date(enddate).toISOString()) {
        // End date: decrement from the beginning of the day to the end slot
        const slotsToDecrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          0,
          ['morning', 'afternoon', 'evening', 'night'].indexOf(endslot) + 1
        );
        await decrementSlots(slotDoc, slotsToDecrement);
      } else {
        // Middle dates: decrement all slots
        await decrementSlots(slotDoc, ['morning', 'afternoon', 'evening', 'night']);
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    res.sendFile(path.join(__dirname, 'public', 'submit_display.html'));
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).send('Error saving data');
  }
});

// Handle edit request for Hostel 3 (adding back slots)
app.post('/editN', async (req, res) => {
  try {
    const { mailid, startdate, startslot, enddate, endslot } = req.body;
    
    // Convert dates to UTC and initialize slot counts
    let currentDate = new Date(startdate);
    currentDate.setUTCHours(0, 0, 0, 0);
    const endDateObj = new Date(enddate);
    endDateObj.setUTCHours(0, 0, 0, 0);

    while (currentDate <= endDateObj) {
      let dateStr = currentDate.toISOString().split('T')[0];
      let slotDoc = await SlotHostel3.findOne({ date: dateStr });

      if (!slotDoc) {
        // Initialize new slot document if not found
        slotDoc = new SlotHostel3({ date: dateStr });
      }

      // Increment slot counts based on booking data
      if (currentDate.toISOString() === new Date(startdate).toISOString()) {
        // Start date: increment from start slot to the end of the day
        const slotsToIncrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          ['morning', 'afternoon', 'evening', 'night'].indexOf(startslot)
        );
        await incrementSlots(slotDoc, slotsToIncrement);
      } else if (currentDate.toISOString() === new Date(enddate).toISOString()) {
        // End date: increment from the beginning of the day to the end slot
        const slotsToIncrement = ['morning', 'afternoon', 'evening', 'night'].slice(
          0,
          ['morning', 'afternoon', 'evening', 'night'].indexOf(endslot) + 1
        );
        await incrementSlots(slotDoc, slotsToIncrement);
      } else {
        // Middle dates: increment all slots
        await incrementSlots(slotDoc, ['morning', 'afternoon', 'evening', 'night']);
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    res.sendFile(path.join(__dirname, 'public', 'edit_display.html')); // Confirmation page
  } catch (err) {
    console.error('Error updating slots:', err);
    res.status(500).send('Error updating slots');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
