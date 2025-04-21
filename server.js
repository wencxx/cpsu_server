const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('./models/user')
const idCardApplicaton = require('./models/id-card')
const goodMoralRequests = require('./models/good-moral')
const axios = require('axios')
const moment = require('moment-timezone');
const twilio = require('twilio');

const app = express()
app.use(cors())
app.use(express.json())

connectDB()

const saltRounds = 10
const secretKey = 'cpsu_appointment'

const accountSid = 'AC78fea3302f25ff4bba8d680104eae296';
const authToken = 'dfcd221286f9711ae7bdf85572c52517';
const fromNumber = '+16163444797';

const client = twilio(accountSid, authToken);

async function sendApprovalSms(to, message) {
    try {
        const response = await axios.post('https://www.traccar.org/sms', {
            "to": to,
            "message": message
        }, {
            headers: {
                Authorization: 'cSHfxTltTBCRNGKQYj8jZI:APA91bEpuKfr7Wse6Br4Um0hq3jhAS_IGkFRQaEjRP6IcbYJw9IDDThVszoRdePTSIRq0na1uQgj4Akg2x2nPduuk6wTzK31KTa8xgsZjcIYjLgxuPm6Yk4'
            }
        })

        console.log('SMS sent:', response.sid);
        return response;
    } catch (error) {
        console.error('Error sending SMS:', error.message);
    }
}

// async function sendApprovalSms(to, message) {
//     try {
//         const response = await client.messages.create({
//             body: message,
//             from: fromNumber,
//             to: `+${to}`
//         });

//         console.log('SMS sent:', response.sid);
//         return response;
//     } catch (error) {
//         console.error('Error sending SMS:', error.message);
//     }
// }

// user endpoints
app.post('/register', async (req, res) => {
    const { password, ...data } = req.body;

    try {
        const hash = await bcrypt.hash(password, saltRounds);

        const user = new User({ ...data, password: hash });

        await user.save();

        res.send('User created successfully.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.send('Username and password are required');
    }

    try {
        const user = await User.findOne({ username }).lean();

        if (!user) {
            return res.send('User not found');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.send('Incorrect password');
        }

        const token = jwt.sign(user, secretKey, {
            expiresIn: "10m"
        })

        res.send({ message: 'Login successful', userData: { ...user, token } });
    } catch (error) {
        console.log(error);
        res.send('Server error');
    }
});

// id card applications crud
app.post('/idcard-application', async (req, res) => {
    try {
        const application = new idCardApplicaton(req.body);

        await application.save();

        res.send('Application submitted.')
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

app.get('/idcard-application', async (req, res) => {
    try {
        const applications = await idCardApplicaton.find().sort({ createdAt: -1 });

        if (applications.length) {
            res.send(applications)
        } else {
            res.send("No applications found")
        }
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

app.put('/idcard-application/:id', async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.scheduleDate) {
        updateData.scheduleDate = moment(updateData.scheduleDate).tz('Asia/Manila').format();
    }

    try {
        const updatedApplication = await idCardApplicaton.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedApplication) {
            return res.status(404).send('Application not found');
        }

        await sendApprovalSms(updatedApplication.number, `Request has been rescheduled on ${updatedApplication.scheduleDate}.`);

        res.send('Application updated.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

app.delete('/idcard-application/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedApplication = await idCardApplicaton.findByIdAndDelete(id);

        if (!deletedApplication) {
            return res.status(404).send('Application not found');
        }

        res.send('Application deleted.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

// goodmoral crud
app.post('/good-moral-requests', async (req, res) => {
    try {
        const goodMoral = new goodMoralRequests(req.body);

        await goodMoral.save();

        res.send('Requests submitted.')
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

app.get('/good-moral-requests', async (req, res) => {
    try {
        const goodMoral = await goodMoralRequests.find().sort({ createdAt: -1 });

        if (goodMoral.length) {
            res.send(goodMoral)
        } else {
            res.send("No requests found")
        }
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

app.put('/good-moral-requests/:id', async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.selectedDate) {
        updateData.selectedDate = moment(updateData.selectedDate).tz('Asia/Manila').format();
    }

    try {
        const updatedRequest = await goodMoralRequests.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedRequest) {
            return res.status(404).send('Request not found');
        }

        await sendApprovalSms(updatedRequest.number, `Request has been rescheduled on ${updatedRequest.selectedDate}.`);

        res.send('Request updated.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

app.delete('/good-moral-requests/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deleteRequest = await goodMoralRequests.findByIdAndDelete(id);

        if (!deleteRequest) {
            return res.status(404).send('Request not found');
        }

        res.send('Request deleted.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

// admin side
app.get('/approved-application', async (req, res) => {
    try {
        const applications = await idCardApplicaton.find({ status: 'Approved' }).sort({ createdAt: -1 });

        if (applications.length) {
            res.send(applications)
        } else {
            res.send("No applications found")
        }
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

app.get('/pending-application', async (req, res) => {
    try {
        const applications = await idCardApplicaton.find({ status: 'Pending' }).sort({ createdAt: -1 });

        if (applications.length) {
            res.send(applications)
        } else {
            res.send("No applications found")
        }
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

app.put('/approve-application/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const updateApplication = await idCardApplicaton.findByIdAndUpdate(id, { status: 'Approved' }, { new: true });

        if (!updateApplication) {
            return res.status(404).send('Application not found');
        }

        // Send SMS notification
        await sendApprovalSms(updateApplication.number, `Request has been approved. Please settle your payment at Cashier's Office.`);

        res.send('Application approved.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

app.put('/claim-application/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const updatedRequest = await idCardApplicaton.findByIdAndUpdate(id, { claimed: true }, { new: true });

        if (!updatedRequest) {
            return res.status(404).send('Request not found');
        }

        // Send SMS notification
        await sendApprovalSms(updatedRequest.number, `Your request was successfully given to you.`);

        res.send('Request claimed.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

app.get('/approved-requests', async (req, res) => {
    try {
        const requests = await goodMoralRequests.find({ status: 'Approved' }).sort({ createdAt: -1 });

        if (requests.length) {
            res.send(requests)
        } else {
            res.send("No requests found")
        }
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

app.get('/pending-requests', async (req, res) => {
    try {
        const requests = await goodMoralRequests.find({ status: 'Pending' }).sort({ createdAt: -1 });

        if (requests.length) {
            res.send(requests)
        } else {
            res.send("No requests found")
        }
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

app.put('/approve-requests/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const updatedRequest = await goodMoralRequests.findByIdAndUpdate(id, { status: 'Approved' }, { new: true });

        if (!updatedRequest) {
            return res.status(404).send('Request not found');
        }

        // Send SMS notification
        await sendApprovalSms(updatedRequest.number, `Request has been approved. Please settle your payment at Cashier's Office.`);

        res.send('Request approved.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

app.put('/claim-request/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const updatedRequest = await goodMoralRequests.findByIdAndUpdate(id, { claimed: true }, { new: true });

        if (!updatedRequest) {
            return res.status(404).send('Request not found');
        }

        // Send SMS notification
        await sendApprovalSms(updatedRequest.number, `Your request was successfully given to you.`);

        res.send('Request claimed.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

app.get('/recent-requests', async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRequests = await goodMoralRequests.find({
            createdAt: { $gte: thirtyDaysAgo },
            status: 'Approved',
            claimed: true,
        }).sort({ createdAt: -1 });

        res.status(200).json(recentRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/recent-applications', async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentRequests = await idCardApplicaton.find({
            createdAt: { $gte: thirtyDaysAgo },
            status: 'Approved',
            claimed: true,
        }).sort({ createdAt: -1 });

        res.status(200).json(recentRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


const port = 3000

app.listen(port, () => {
    console.log(`Connected to port: ${port}`)
})