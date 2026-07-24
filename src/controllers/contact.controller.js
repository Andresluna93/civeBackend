import chat from "../models/session.model.js";

export const getContacts = async (req, res) => {
  try {
    const contacts = await chat.aggregate([
      {
        $group: {
          _id: "$wa_id",
          name: { $last: "$name" },
          ultimoChat: { $last: "$createdAt" },
        },
      },
      { $project: { _id: 0, wa_id: "$_id", name: 1, ultimoChat: 1 } },
      { $sort: { ultimoChat: -1 } },
    ]);
    res.status(200).json({ success: true, data: contacts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
