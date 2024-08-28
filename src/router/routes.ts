import { Router } from "express";
import * as Document from "../controllers/document";
const router = Router();

router.post("/uploadDocument", Document.DocumentUpload);



export default router