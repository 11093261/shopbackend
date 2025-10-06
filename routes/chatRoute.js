const express = require("express")
const chatController = require("../controllers/chatControlller")
const authMiddleware = require("../middleware/auth")
const router = express.Router()
router.get("/getChat",authMiddleware,chatController.getAllChat)
router.get("/getAchat/:id",authMiddleware,chatController.getAchat)
router.post("/postedChat",chatController.createChat)
router.put("/updatedChat/id",authMiddleware,chatController.updateChats)
module.exports = router