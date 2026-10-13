const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for cross-origin requests (Netlify frontend -> Render backend)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// 1. MongoDB Connection
const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
    console.warn("⚠️ Warning: MONGODB_URL environment variable is not defined. Server running without MongoDB connection. Provide MONGODB_URL in your environment or .env file.");
} else {
    mongoose.connect(MONGODB_URL)
        .then(() => console.log("MongoDB Connected Successfully"))
        .catch((err) => console.error("MongoDB Connection Error:", err.message));
}


// 3. User Schema
const userSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ["admin", "volunteer", "emergency user", "donor"]
    },

    name: {
        type: String,
        default: ""
    },

    emailOrPhone: {
        type: String,
        required: true,
        unique: true
    },

    phone: {
        type: String,
        default: ""
    },

    location: {
        type: String,
        default: ""
    },

    blood: {
    type: String,
    default: ""
},

status: {
    type: String,
    default: ""
},

tasks: {
    type: String,
    default: ""
},

hours: {
    type: String,
    default: ""
},

rating: {
    type: String,
    default: ""
},

    password: {
        type: String,
        required: true
    }
});


// 4. User Model
const User = mongoose.model("User", userSchema);
app.get("/api/volunteers", async (req, res) => {
    try {
        const volunteers = await User.find(
            { role: "volunteer" },
            { name: 1, phone: 1, location: 1 }
        );

        res.json(volunteers);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch volunteers",
            error: error.message
        });
    }
});

// 5. Task Schema
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    },

    status: {
        type: String,
        enum: [
    "available",
    "accepted",
    "on-the-way",
    "arrived",
    "in-progress",
    "completed"
],
        default: "available"
    },

    assignedVolunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }

}, { timestamps: true });


// 6. Task Model
const Task = mongoose.model("Task", taskSchema);

// Emergency Request Schema

  const emergencySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    priority: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "high"
    },

    status: {
        type: String,
        enum: ["pending", "approved", "resolved"],
        default: "pending"
    },

    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }

}, { timestamps: true });

const Emergency = mongoose.model("Emergency", emergencySchema);

// ================= CHAT MESSAGE SCHEMA =================


// Notification Schema

const notificationSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    type: {
        type: String,
        default: "update"
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const Notification =
    mongoose.model("Notification", notificationSchema);

app.get("/api/notifications", async (req, res) => {
    try {

        const notifications =
            await Notification.find()
                .sort({ createdAt: -1 });

        res.json(notifications);

    } catch (error) {

        res.status(500).json({
            message: "Failed to load notifications",
            error: error.message
        });

    }
});

app.post("/api/notifications", async (req, res) => {
    try {

        const notification = new Notification({
            title: req.body.title,
            message: req.body.message,
            type: req.body.type || "update"
        });

        await notification.save();

        res.status(201).json({
            message: "Notification created successfully",
            notification
        });

    } catch (error) {

        res.status(500).json({
            message: "Failed to create notification",
            error: error.message
        });

    }
});

// Chat Message Schema
const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    receiver: {

        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    message: {
        type: String,
        required: true
    },

    isRead: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

// ================= USER APIs =================

// 7. Register API
app.post("/api/register", async (req, res) => {
    try {

        console.log("REGISTER BODY:",req.body);

        const { role, name, emailOrPhone, phone, location, password } = req.body;

        if (!role || !emailOrPhone || !password) {
            return res.status(400).json({
                message: "Role, Email/Phone and Password are required"
            });
        }

        const existingUser = await User.findOne({ emailOrPhone });
        if (existingUser) {
            return res.status(409).json({
                message: "An account already exists with this Email/Phone"
            });
        }

        const newUser = new User({
            role,
            name,
            emailOrPhone,
            phone,
            location,
            password
        });

        await newUser.save();

        res.status(201).json({
            message: "User registered successfully",
            userId: newUser._id
        });

    } catch (error) {

        console.log("REGISTER ERROR:",error.message);

        res.status(500).json({
            message: error.message
        });
    }
});


// 8. Login API
app.post("/api/login", async (req, res) => {
    try {
        const roleValue = String(req.body.role || "").trim();
        const emailValue = String(req.body.emailOrPhone || "").trim();
        const passwordValue = String(req.body.password || "");

        if (!roleValue || !emailValue || !passwordValue) {
            return res.status(400).json({
                message: "Role, Email/Phone and Password are required"
            });
        }

        const user = await User.findOne({
            role: roleValue,
            emailOrPhone: emailValue,
            password: passwordValue
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid role, email/phone or password"
            });
        }

        res.json({
    message: "Login successful",
    role: user.role,
    userId: user._id,
    name: user.name,
    emailOrPhone: user.emailOrPhone,
    phone: user.phone,
    location: user.location
});

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

app.get("/api/admin/volunteers", async (req, res) => {
    try {
        const volunteers = await User.find({
            role: "volunteer"
        }).select("-password");

        res.json(volunteers);

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch volunteers",
            error: error.message
        });
    }
});

// ================= TASK APIs =================

// 9. Create Task API

app.post("/api/tasks", async (req, res) => {
    try {
        const { title, description, location, priority, volunteerId } = req.body;

        const taskPriority = priority ? priority.toLowerCase() : "low";

        const newTask = new Task({
            title,
            description,
            location,
            priority: taskPriority
        });

        if (volunteerId) {
            newTask.assignedVolunteer = volunteerId;
        }

        await newTask.save();

        res.status(201).json({
            message: "Task created successfully",
            task: newTask
        });

    } catch (error) {
        console.error("Create Task Error:", error);

        res.status(500).json({
            message: "Failed to create task",
            error: error.message
        });
    }
});


// 10. Get All Tasks API
app.get("/api/tasks", async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate("assignedVolunteer", "name emailOrPhone");

        res.json(tasks);

    } catch (error) {
        res.status(500).json({
            message: "Failed to get tasks",
            error: error.message
        });
    }
});

// Edit Task API
app.put("/api/tasks/:taskId", async (req, res) => {
    try {
        const updateData = {};
        if (req.body.title !== undefined) updateData.title = req.body.title;
        if (req.body.description !== undefined) updateData.description = req.body.description;
        if (req.body.location !== undefined) updateData.location = req.body.location;
        if (req.body.priority !== undefined) updateData.priority = String(req.body.priority).toLowerCase();
        if (req.body.status !== undefined) updateData.status = req.body.status;
        if (req.body.volunteerId && mongoose.Types.ObjectId.isValid(req.body.volunteerId)) {
            updateData.assignedVolunteer = req.body.volunteerId;
        }

        const task = await Task.findByIdAndUpdate(
            req.params.taskId,
            updateData,
            { new: true }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json({
            message: "Task updated successfully",
            task
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update task",
            error: error.message
        });
    }
});

// 11. Accept Task API
app.put("/api/tasks/:taskId/accept", async (req, res) => {
    try {
        const { volunteerId } = req.body;

        const task = await Task.findById(req.params.taskId);

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        if (task.status !== "available") {
            return res.status(400).json({
                message: "Task is not available"
            });
        }

        task.status = "accepted";
        task.assignedVolunteer = volunteerId;

        await task.save();

        res.json({
            message: "Task accepted successfully",
            task
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to accept task",
            error: error.message
        });
    }
});
// Admin Assign Volunteer API
app.put("/api/tasks/:taskId/assign", async (req, res) => {
    try {
        const { volunteerId } = req.body;

        const task = await Task.findById(req.params.taskId);

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        if (task.assignedVolunteer) {
            return res.status(400).json({
                message: "Task already assigned"
            });
        }

        task.status = "accepted";
        task.assignedVolunteer = volunteerId;

        await task.save();

        res.json({
            message: "Task assigned successfully",
            task
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to assign task",
            error: error.message
        });
    }
});


// 12. My Tasks API
app.get("/api/tasks/volunteer/:volunteerId", async (req, res) => {
    try {
        const tasks = await Task.find({
            assignedVolunteer: req.params.volunteerId
        });

        res.json(tasks);

    } catch (error) {
        res.status(500).json({
            message: "Failed to get volunteer tasks",
            error: error.message
        });
    }
});


// 13. Update Task Status API
app.put("/api/tasks/:taskId/status", async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatus = [
            "available",
            "accepted",
            "on-the-way",
            "arrived",
            "in-progress",
            "completed"
        ];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const task = await Task.findByIdAndUpdate(
            req.params.taskId,
            { status },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json({
            message: "Task status updated successfully",
            task
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update status",
            error: error.message
        });
    }
});

// ================= PROFILE APIs =================

// Get User Profile
app.get("/api/profile/:userId", async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(user);

    } catch (error) {
        res.status(500).json({
            message: "Failed to get profile",
            error: error.message
        });
    }
});


// Update User Profile
app.put("/api/profile/:userId", async (req, res) => {
    try {
        const {
    name,
    phone,
    location,
    blood,
    status,
    tasks,
    hours,
    rating
} = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            {
                name,
                phone,
                location,
                blood,
                status,
                tasks,
                hours,
                rating 
            },
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            message: "Profile updated successfully",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update profile",
            error: error.message
        });
    }
});

// ================= EMERGENCY APIs =================

// Create Emergency Request
app.post("/api/emergencies", async (req, res) => {
    try {

        console.log("EMERGENCY BODY:", req.body);

        const {
            title,
            description,
            location,
            priority,
            requestedBy
        } = req.body;

        const newEmergency = new Emergency({
            title,
            description,
            location,
            priority: priority ? priority.toLowerCase() : "high",
            requestedBy: (requestedBy && mongoose.Types.ObjectId.isValid(requestedBy)) ? requestedBy : null
        });

        await newEmergency.save();

        console.log("EMERGENCY SAVED:", newEmergency);

        res.status(201).json({
            message: "Emergency request created successfully",
            emergency: newEmergency
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create emergency request",
            error: error.message
        });
    }
});


// Get All Emergency Requests
app.get("/api/emergencies", async (req, res) => {
    try {
        const emergencies = await Emergency.find()
            .populate("requestedBy", "name emailOrPhone role");

        res.json(emergencies);

    } catch (error) {
        res.status(500).json({
            message: "Failed to get emergency requests",
            error: error.message
        });
    }
});


// Update Emergency Status
app.put("/api/emergencies/:emergencyId/status", async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatus = [
            "pending",
            "approved",
            "resolved"
        ];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const emergency = await Emergency.findByIdAndUpdate(
            req.params.emergencyId,
            { status },
            { new: true }
        );

        if (!emergency) {
            return res.status(404).json({
                message: "Emergency request not found"
            });
        }

        res.json({
            message: "Emergency status updated successfully",
            emergency
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update emergency status",
            error: error.message
        });
    }
});

// ================= CHAT APIs =================

// AI Emergency Assistant Chat API (used by task.html)
app.post("/api/chat", async (req, res) => {
    try {
        const { message = "" } = req.body;
        const text = String(message).toLowerCase();

        let reply = "Hello! I am your disaster response coordination assistant. How can I assist you with your tasks or emergency operations today?";

        if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
            reply = "Hello! 👋 I am your emergency response assistant. You can ask me about assigned tasks, reporting emergencies, safety protocols, or volunteer status.";
        } else if (text.includes("sos") || text.includes("danger") || text.includes("critical")) {
            reply = "🚨 Emergency alert noted! For immediate physical danger, trigger the SOS button on the Emergency page or dial local emergency services immediately.";
        } else if (text.includes("task") || text.includes("assigned")) {
            reply = "You can view, accept, and update assigned tasks in your volunteer dashboard. Keep your status updated to coordinate effectively!";
        } else if (text.includes("status") || text.includes("progress")) {
            reply = "Task progression: Available -> Accepted -> On the way -> Arrived -> In progress -> Completed. Please keep the dispatch log updated!";
        } else if (text.includes("shelter") || text.includes("camp")) {
            reply = "Active relief shelters are updated by coordinators. Check the Admin and Emergency overview for nearest designated zones.";
        } else if (text.includes("medical") || text.includes("first aid")) {
            reply = "Prioritize triage: ensure airway, breathing, circulation, stop severe bleeding, and request emergency medical volunteer transport.";
        } else {
            reply = `Coordination acknowledged for: "${message}". Please proceed according to field safety guidelines and update your task status.`;
        }

        res.json({
            reply,
            message: reply
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to process chat",
            error: error.message
        });
    }
});

// Send Message
app.post("/api/messages", async (req, res) => {
    try {
        const { sender, receiver, message } = req.body;

        const newMessage = new Message({
            sender,
            receiver,
            message
        });

        await newMessage.save();

        res.status(201).json({
            message: "Message sent successfully",
            data: newMessage
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to send message",
            error: error.message
        });
    }
});


// Get Messages Between Two Users
app.get("/api/messages/:userId/:otherUserId", async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;

        const messages = await Message.find({
            $or: [
                {
                    sender: userId,
                    receiver: otherUserId
                },
                {
                    sender: otherUserId,
                    receiver: userId
                }
            ]
        })
        .populate("sender", "name role")
        .populate("receiver", "name role")
        .sort({ createdAt: 1 });

        res.json(messages);

    } catch (error) {
        res.status(500).json({
            message: "Failed to get messages",
            error: error.message
        });
    }
});


// Mark Message as Read
app.put("/api/messages/:messageId/read", async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.messageId,
            { isRead: true },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({
                message: "Message not found"
            });
        }

        res.json({
            message: "Message marked as read",
            data: message
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update message",
            error: error.message
        });
    }
});

// ================= DASHBOARD APIs =================

app.get("/api/dashboard/stats", async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments();

        const availableTasks = await Task.countDocuments({
            status: "available"
        });

        const acceptedTasks = await Task.countDocuments({
            status: "accepted"
        });

        const inProgressTasks = await Task.countDocuments({
            status: "in-progress"
        });

        const completedTasks = await Task.countDocuments({
            status: "completed"
        });

        const totalEmergencies = await Emergency.countDocuments();

        const pendingEmergencies = await Emergency.countDocuments({
            status: "pending"
        });

        res.json({
            totalTasks,
            availableTasks,
            acceptedTasks,
            inProgressTasks,
            completedTasks,
            totalEmergencies,
            pendingEmergencies
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to get dashboard statistics",
            error: error.message
        });
    }
});

// ================= ADMIN / COORDINATOR APIs =================

// Get All Users
app.get("/api/admin/users", async (req, res) => {
    try {
        const users = await User.find().select("-password");

        res.json(users);

    } catch (error) {
        res.status(500).json({
            message: "Failed to get users",
            error: error.message
        });
    }
});


// Get All Volunteers
app.get("/api/admin/volunteers", async (req, res) => {
    try {
        const volunteers = await User.find({
            role: "volunteer"
        }).select("-password");

        res.json(volunteers);

    } catch (error) {
        res.status(500).json({
            message: "Failed to get volunteers",
            error: error.message
        });
    }
});


// Get Single Task Details
app.get("/api/admin/tasks/:taskId", async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId)
            .populate(
                "assignedVolunteer",
                "name emailOrPhone phone location"
            );

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json(task);

    } catch (error) {
        res.status(500).json({
            message: "Failed to get task details",
            error: error.message
        });
    }
});


// Get All Emergency Requests with User Details
app.get("/api/admin/emergencies", async (req, res) => {
    try {
        const emergencies = await Emergency.find()
            .populate(
                "requestedBy",
                "name emailOrPhone phone location role"
            )
            .sort({ createdAt: -1 });

        res.json(emergencies);

    } catch (error) {
        res.status(500).json({
            message: "Failed to get emergencies",
            error: error.message
        });
    }
});
 
// ================= DONATION APIs =================

const donationSchema = new mongoose.Schema({

    donorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    amount: {
        type: Number,
        required: true
    },

    paymentMethod: {
        type: String,
        required: true
    },

    status: {
        type: String,
        default: "completed"
    }

}, { timestamps: true });


const Donation = mongoose.model("Donation", donationSchema);


// Save Donation
app.post("/api/donations", async (req, res) => {
    try {

        const {
            donorId,
            amount,
            paymentMethod
        } = req.body;

        const donation = new Donation({
            donorId: (donorId && mongoose.Types.ObjectId.isValid(donorId)) ? donorId : null,
            amount: Number(amount) || 0,
            paymentMethod: paymentMethod || "Online"
        });

        await donation.save();

        res.status(201).json({
            message: "Donation saved successfully",
            donation
        });

    } catch (error) {

        res.status(500).json({
            message: "Failed to save donation",
            error: error.message
        });

    }
});


// Get All Donations
app.get("/api/donations", async (req, res) => {
    try {

        const donations = await Donation.find()
            .populate("donorId", "name emailOrPhone")
            .sort({ createdAt: -1 });

        res.json(donations);

    } catch (error) {

        res.status(500).json({
            message: "Failed to get donations",
            error: error.message
        });

    }
});

// ================= HEALTH =================

// ================= HEALTH =================
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// ================= FRONTEND ROUTING =================

// Static file serving
app.use(express.static(__dirname));

// Home page routing - routes root / to first.html as requested
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "first.html"));
});

app.get("/first.html", (req, res) => {
    res.sendFile(path.join(__dirname, "first.html"));
});

app.get("/first", (req, res) => {
    res.sendFile(path.join(__dirname, "first.html"));
});

app.get("/index.html", (req, res) => {
    res.sendFile(path.join(__dirname, "first.html"));
});

// Server start - binds to 0.0.0.0 and process.env.PORT for Render production
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT} (environment: ${process.env.NODE_ENV || 'production'})`);
});