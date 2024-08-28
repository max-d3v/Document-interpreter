import express, { Express, NextFunction, Request, Response } from "express";
import router from "./router/routes";
interface serverConfig {
    port: number;
    node_env: string;
}

export class HttpError extends Error {
    constructor(public statusCode: number, message: string) {
      super(message);
    }
}
  

export class Server {
    private port: number
    private node_env: string;
    private app: Express;

    constructor({port, node_env}: serverConfig) {
        this.port = port;
        this.node_env = node_env;
        this.app = express();
        
        this.middlewares();
        this.routes();
        this.errorHandler();
    }

    private middlewares(): void {
        this.app.use(express.json());
    }

    private routes(): void {
        this.app.get("/", (req, res) => {
            res.status(200).send({status: "ok"});
        });

        this.app.use("/api/v1", router);
    }

    private errorHandler(): void {
        this.app.use(this.ErrorHandling);
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        })
    }

    private ErrorHandling = (err: HttpError | Error, req: Request, res: Response, next: NextFunction): void => {
        console.error(err.stack);
        const statusCode = (err as HttpError).statusCode || 500;
        const message = err.message || 'An unexpected error occurred';
        
        res.status(statusCode).json({ error: message });   
    }
}