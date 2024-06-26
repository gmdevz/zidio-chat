const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
	{
		text: {
			type: String,
		},
		file: { type: String },
		sender: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},

		recipient: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{
		timestamps: true,
	},
);

const MessageModel = mongoose.model("Message", MessageSchema);

module.exports = MessageModel;
