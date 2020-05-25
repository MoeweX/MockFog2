const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

function getLogger(labelName) {
    const logger = createLogger({
        level: "silly",
        format: combine(
            label({ label: labelName }),
            timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.colorize(),
            myFormat,
        ),
        transports: [
            new transports.Console(),
            new transports.File({ filename: "../logs/agent.log" }),
        ],
        exceptionHandlers: [
            new transports.File({ filename: "../logs/agent-exceptions.log" })
        ],
        // rejectionHandlers: [
        //     new transports.File({ filename: '../logs/agent-rejections.log' })
        // ]
    });

    return logger
}

module.exports = getLogger