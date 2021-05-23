import { ILogger, LogLevel } from "./core/types";

export class ConsoleLogger implements ILogger {
    log(level: LogLevel, msg: string): void {
        switch(level) {
            case LogLevel.Info:
                console.log(`[info   ] ${msg}`);
                break;
            case LogLevel.Debug:
                console.log(`[debug  ] ${msg}`);
                break;
            case LogLevel.Warning:
                console.log(`[warn   ] ${msg}`);
                break;
            case LogLevel.Error:
                console.log(`[error  ] ${msg}`);
                break;
        }
        console.log(`[????   ] ${msg}`);
    }
    logFunc() {
        return (level: LogLevel, msg: string)  => {
            this.log(level, msg);
        }
    }
}