const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('./models/user')
const idCardApplicaton = require('./models/id-card')
const goodMoralRequests = require('./models/good-moral')
const axios = require('axios')

const app = express()
app.use(cors())
app.use(express.json())

connectDB()

const saltRounds = 10
const secretKey = 'cpsu_appointment'

async function sendApprovalSms(to, message) {
    try {
        const response = await axios.post(
            // 'https://e59w93.api.infobip.com/sms/2/text/advanced',
            'https://e5mnw3.api.infobip.com/sms/2/text/advanced',
            {
                messages: [
                    {
                        destinations: [{ to: to }],
                        from: '447491163443',
                        text: message
                    }
                ]
            },
            {
                headers: {
                    // 'Authorization': 'App 74f9b6a9febc7397bd6ceb5844d41ca7-19d66a87-ad81-4533-a2fa-cdb8a930ac9d',
                    'Authorization': 'App d6ccf75c89001ec61facd51e779fd4ae-910edbb7-e644-4369-b629-5e0023ff034c',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        console.log('SMS sent:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending SMS:', error.response ? error.response.data : error.message);
    }
}

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
        const applications = await idCardApplicaton.find()

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

    try {
        const updatedApplication = await idCardApplicaton.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedApplication) {
            return res.status(404).send('Application not found');
        }

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
        const goodMoral = await goodMoralRequests.find()

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

    try {
        const updatedRequest = await goodMoralRequests.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedRequest) {
            return res.status(404).send('Request not found');
        }

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
        const applications = await idCardApplicaton.find({ status: 'Approved' })

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
        const applications = await idCardApplicaton.find({ status: 'Pending' })

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
        await sendApprovalSms(updateApplication.number, `Hello ${updateApplication.fullName}, Your application has been approved.`);

        res.send('Application approved.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

app.get('/approved-requests', async (req, res) => {
    try {
        const requests = await goodMoralRequests.find({ status: 'Approved' })

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
        const requests = await goodMoralRequests.find({ status: 'Pending' })

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
        await sendApprovalSms(updatedRequest.number, `Hello ${updatedRequest.fullName}, Your request has been approved.`);

        res.send('Request approved.');
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
            status: 'Approved'
        });

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
            status: 'Approved'
        });

        res.status(200).json(recentRequests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


const port = 3000

app.listen(port, () => {
    console.log(`Connected to port: ${port}`)
})