import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: String,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: String,
            ref: "User",
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        // createdAt, updatedAt
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;