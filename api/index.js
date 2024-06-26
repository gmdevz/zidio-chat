const express = require("express");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const ws = require("ws");
const fs = require("fs");

dotenv.config();
mongoose.connect(process.env.MONGO_URL);
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const User = require("./models/User");
const Message = require("./models/Message");

const app = express();

app.use("/uploads", express.static(__dirname + "/uploads"));

// Need this to parse the body of the request
app.use(express.json());

app.use(cookieParser());

app.use(
	cors({
		credentials: true,
		origin: process.env.CLIENT_URL,
	}),
);

async function getUserDataFromRequest(req) {
	return new Promise((resolve, reject) => {
		const token = req.cookies?.token;
		if (token) {
			jwt.verify(token, jwtSecret, (err, userData) => {
				if (err) throw err;
				resolve(userData);
			});
		} else {
			reject("no token");
		}
	});
}

app.get("/test", (_req, res) => {
	res.json("test ok");
});

app.get("/messages/:userId", async (req, res) => {
	const { userId } = req.params;
	const userData = await getUserDataFromRequest(req);
	const ourUserId = userData.userId;

	const messages = await Message.find({
		sender: { $in: [ourUserId, userId] },
		recipient: { $in: [ourUserId, userId] },
	}).sort({ createdAt: 1 });

	res.json(messages);
});

app.get("/people", async (_req, res) => {
	const users = await User.find({}, { _id: 1, username: 1 });
	res.json(users);
});

app.get("/profile", (req, res) => {
	const token = req.cookies?.token;
	if (token) {
		jwt.verify(token, jwtSecret, (err, userData) => {
			if (err) throw err;
			res.json(userData);
		});
	} else {
		res.status(401).json({ error: "Unauthorized" });
	}
});

app.post("/login", async (req, res) => {
	const { username, password } = req.body;
	const foundUser = await User.findOne({ username });
	if (foundUser) {
		const isMatch = bcrypt.compareSync(password, foundUser.password);
		if (isMatch) {
			jwt.sign(
				{ userId: foundUser._id, username },
				jwtSecret,
				(_err, token) => {
					try {
						res.cookie("token", token).status(200).json({
							id: foundUser._id,
						});
					} catch (err) {
						console.log(err);
					}
				},
			);
		} else {
			res.status(401).json({ error: "Unauthorized" });
		}
	}
});

app.post("/logout", (req, res) => {
	try {
		res.cookie("token", "").json("ok");
	} catch (err) {
		console.log(err);
	}
});

app.post("/register", async (req, res) => {
	// Need express.json() for request body to work
	const { username, password } = req.body;
	try {
		const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
		const createdUser = await User.create({
			username: username,
			password: hashedPassword,
		});
		jwt.sign(
			{ userId: createdUser._id, username },
			jwtSecret,
			(_err, token) => {
				if (_err) throw _err;
				res.cookie("token", token).status(201).json({
					id: createdUser._id,
				});
			},
		);
	} catch (err) {
		if (err) throw err;
		res.status(500).json("Error");
	}
});

const server = app.listen(4040);

const wss = new ws.WebSocketServer({ server });

wss.on("connection", (connections, req) => {
	function notifyAboutOnlinePeople() {
		[...wss.clients].forEach((client) => {
			client.send(
				JSON.stringify({
					online: [...wss.clients].map((c) => ({
						userId: c.userId,
						username: c.username,
					})),
				}),
			);
		});
	}

	connections.isAlive = true;

	connections.timer = setInterval(() => {
		connections.ping();
		connections.deathTimer = setTimeout(() => {
			connections.isAlive = false;
			clearInterval(connections.timer);
			connections.terminate();
			notifyAboutOnlinePeople();
			console.log("dead");
		}, 1000);
	}, 5000);

	connections.on("pong", () => {
		clearTimeout(connections.deathTimer);
	});

	// read username and id from cookie for this connection
	const cookies = req.headers.cookie;

	if (cookies) {
		const tokenCookieString = cookies
			.split(";")
			.find((str) => str.startsWith("token="));
		if (tokenCookieString) {
			const token = tokenCookieString.split("=")[1];
			if (token) {
				jwt.verify(token, jwtSecret, {}, (err, userData) => {
					if (err) throw err;
					const { userId, username } = userData;
					connections.userId = userId;
					connections.username = username;
				});
			}
		}
	}

	connections.on("message", async (message) => {
		const messageData = JSON.parse(message.toString());
		const { recipient, text, file } = messageData;
		let fileName = null;
		// console.log({ file });

		if (file) {
			const parts = file.name.split(".");
			const ext = parts[parts.length - 1];
			fileName = Date.now() + "." + ext;
			const path = __dirname + "/uploads/" + fileName;
			const bufferData = new Buffer.from(file.data.split(",")[1], "base64");
			await fs.writeFile(path, bufferData, () => {
				console.log("file saved: " + path);
			});
		}

		if (recipient && (text || file)) {
			const messageDoc = await Message.create({
				sender: connections.userId,
				recipient,
				text,
				file: file ? fileName : null,
			});
			[...wss.clients]
				.filter((client) => client.userId === recipient)
				.forEach((client) =>
					client.send(
						JSON.stringify({
							text,
							sender: connections.userId,
							recipient,
							file: file ? fileName : null,
							_id: messageDoc._id,
						}),
					),
				);
		}
	});

	// notify everyone about online user when a new user connects
	notifyAboutOnlinePeople();
});
