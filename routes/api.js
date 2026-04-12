import { Router } from "express";
const router = Router();

router.post("/login", (req, res) => {
  res.json({ message: "Login successful" });
});

router.get("/data", (req, res) => {
  res.json({ data: "Secure data" });
});

export default router;