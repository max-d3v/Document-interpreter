import multer from "multer";

export const uploadConfig = multer({ storage: multer.memoryStorage() });
