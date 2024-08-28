import { Server } from "./server";
import dotenv from 'dotenv';
dotenv.config();

const startServer = async () => {
    const port = parseInt(process.env.PORT as string);
    const node_env = process.env.NODE_ENV as string;

    try {
        const server = new Server({port, node_env});
        server.start();    
    } catch (err) {
        console.log("Error when starting server: ", err)
    }
}

startServer();