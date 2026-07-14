const express = require("express");
const prisma = require("../prisma");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  res.json(subjects);
});

router.post("/", authenticate, authorize("ADMIN"), async (req, res) => {
  try {
    const { name, code, credits, type, weeklyHours } = req.body;
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        credits: Number(credits) || 3,
        type: type === "LAB" ? "LAB" : "THEORY",
        weeklyHours: Number(weeklyHours) || 3,
      },
    });
    res.json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", authenticate, authorize("ADMIN"), async (req, res) => {
  try {
    const { name, code, credits, type, weeklyHours } = req.body;
    const subject = await prisma.subject.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        code,
        credits: Number(credits),
        type: type === "LAB" ? "LAB" : "THEORY",
        weeklyHours: Number(weeklyHours),
      },
    });
    res.json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", authenticate, authorize("ADMIN"), async (req, res) => {
  try {
    await prisma.subject.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ message: "Cannot delete: subject is in use" });
  }
});

module.exports = router;
