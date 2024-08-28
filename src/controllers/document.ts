import { NextFunction, Request, Response } from "express";
import { createWorker, Worker, RecognizeResult } from "tesseract.js";
import { HttpError } from "../server";
import { uploadConfig } from "../models/multer";
import PdfParse from "pdf-parse";


class DocumentHandler {
    public static async handleDocumentUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.file) {
                throw new HttpError(400, "No document uploaded");
            }

            const document = new DocumentProcessor(req.file);
            await document.processDocument();
            const parsedText = document.getParsedText();

            res.status(200).json({ text: parsedText });
        } catch (err) {
            console.error("Error caught in the controller:", err);
            next(err instanceof HttpError ? err : new HttpError(500, "Internal server error"));
        }
    }
}

class DocumentProcessor {
    private inputDocument: Express.Multer.File;
    private tesseractWorker: Worker | void | null;
    private fileType: string | null;
    private fileTypeName: string | null;
    private parsedText: string | null;

    constructor(inputDocument: Express.Multer.File) {
        this.inputDocument = inputDocument;
        this.fileType = null;
        this.fileTypeName = null;
        this.tesseractWorker = null;
        this.parsedText = null;
    }

    public async processDocument(): Promise<void> {
        const fileType = this.getFileType();
            
        if (fileType[1] == "pdf") {
            await this.ProcessPDF();
        } else if (fileType[0] == "image") {
            await this.ProcessImage();
        } else {
            throw new HttpError(500, "Unsupported file type");
        }
    }

    public getParsedText(): string | null {
        return this.parsedText;
    }

    private async createTesseractWorker(): Promise<void> {
        try {
            this.tesseractWorker = await createWorker(['eng', 'por'])
        } catch(err) {
            console.error("Error creating Tesseract worker:", err);
            throw new HttpError(500, "Error creating Tesseract worker");
        }
    }

    public getFileType(): string[] {
        const fileInfo = this.inputDocument.mimetype.split("/");
        this.fileType = fileInfo[1];
        this.fileTypeName = fileInfo[0];
        return fileInfo;
    }

    public async ProcessImage(): Promise<void> {
        if (this.fileTypeName !== "image") {
            throw new HttpError(500, "Image processor was chosen but no image was sent.");
        }
        
        await this.createTesseractWorker();
        
        if (!this.tesseractWorker) {
            throw new HttpError(500, "Tesseract worker not initialized");
        }

        try {
            const imageBuffer: Buffer = this.inputDocument.buffer;  
            const AbstractedText: RecognizeResult = await this.tesseractWorker.recognize(imageBuffer);
            this.assignParsedText(AbstractedText.data.text);
        } catch (err) {
            console.error("Error processing image:", err);
            throw new HttpError(500, "Error processing image");
        } finally {
            if (this.tesseractWorker) {
                await this.tesseractWorker.terminate();
            }
        }
    }

    private async ProcessPDF(): Promise<void> {
        if (this.fileTypeName !== "application" || this.fileType !== "pdf") {
            throw new HttpError(500, "PDF processor was chosen but no PDF was sent.");
        }

        try {
            const pdfBuffer: Buffer = this.inputDocument.buffer;
            const pdfText = await PdfParse(pdfBuffer);
            this.assignParsedText(pdfText.text);
        } catch (err) {
            console.error("Error processing PDF:", err);
            throw new HttpError(500, "Error processing PDF");
        }
    }

    private assignParsedText(parsedText: string): void {
        this.parsedText = parsedText;
    }
}

export const DocumentUpload = [
    uploadConfig.single("file"),
    DocumentHandler.handleDocumentUpload
];