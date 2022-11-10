import { spawn } from "child_process";
import express from "express";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { Server } from "socket.io";

const REPLY_REGEX = /time=(\d+)ms/;
const LOG_PATH = join(__dirname, "data", "log.json");

interface Ping {
    time: string;
    value: number;
}

(async function () {
    /**
     * retrieve/create the ping log
     */
    let log: Ping[];
    try {
        await mkdir(join(LOG_PATH, ".."), {
            recursive: true
        });

        let content = await readFile(LOG_PATH, "utf-8");

        log = JSON.parse(content);
    } catch (_1) {
        log = [];

        await writeFile(LOG_PATH, JSON.stringify(log));
    }

    /**
     * setup the express server
     */
    let server = express()
        .use(
            "/data/log.json",
            express.static(join(__dirname, "data", "log.json"))
        )
        .use(
            "/js/chart.min.js",
            express.static(
                join(
                    __dirname,
                    "node_modules",
                    "chart.js",
                    "dist",
                    "chart.min.js"
                )
            )
        )
        .use("/", express.static(join(__dirname, "server")))
        .listen(80);

    /**
     * setup the socket.io server
     */
    let socket = new Server(server);

    /**
     * spawn process for ping, send response to socket.io
     */
    let ping = spawn("cmd", ["/K", "ping google.com -t"]);
    ping.stdout.on("data", (data: Buffer) => {
        /**
         * parse line into ms response
         */
        let line = data.toString().trim();
        let value: number;
        let match = line.match(REPLY_REGEX);
        if (match) {
            value = Number(match[1]);
        } else if (line.includes("timed out")) {
            value = 0;
        } else {
            return;
        }

        let time = new Date().toTimeString().split(" ")[0];
        let ping = {
            time,
            value
        };

        /**
         * send to front end
         */
        socket.emit("ping", ping);

        log.push(ping);
    });

    /**
     * every 5 seconds update the log
     */
    setInterval(async () => {
        await writeFile(LOG_PATH, JSON.stringify(log));
    }, 5000);
})();
