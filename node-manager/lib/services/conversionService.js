const logger = require("./logService.js")("Conversion Service")

/**
 * Converts the given information rate to bps (bit per second).
 * Format of input string "<value> <unit>" or "<value><unit>".
 * Value must be an integer.
 * Accepted Units (case sensitive)
 *  - bps (bit per second)
 *  - kbps (kilo bit per second)
 *  - mbps (mega bit per second)
 *  - gbps (giga bit per second)
 *  
 * @param {String} information_rate - the information rate to convert
 * @return {Number} information rate in bps; if not valid return 1000000000 (1gbps)
 */
function convertTobps(information_rate) {
    const noWhiteSpace = information_rate.replace(" ", "")
    
    let valueString = ""
    let unitString = ""

    // split in unitString and valueString
    for (const c of noWhiteSpace) {
        if (c >= '0' && c <= '9') {
            valueString += c
        } else {
            unitString += c
        }
    }

    const value = parseInt(valueString)
    if (value === undefined) {
        logger.error(valueString + " is not an integer; " + information_rate + " is thus not a valid input.")
    }

    switch(unitString) {
        case "bps":
            return value
        case "kbps":
            return (1000 * value)
        case "mbps":
            return (1000 * 1000 * value)
        case "gbps":
            return (1000 * 1000 * 1000 * value)
        default:
            logger.error(unitString + " is not a valid unit; " + information_rate + " is thus not a valid input.")
            return 1000000000
    }
}

/**
 * Converts the given amount of information to MiB (mebibyte).
 * Format of input string "<value> <unit>" or "<value><unit>".
 * Value must be an integer.
 * Accepted Units (case sensitive)
 *  - b (bit per second)
 *  - k (kilo bit per second)
 *  - m (mega bit per second)
 *  - g (giga bit per second)
 *  
 * @param {String} input - the input string to convert
 * @return {Number} amount in mebibyte or 1024, if not a valid input
 */
function convertToMebibyte(input) {
    const noWhiteSpace = input.replace(" ", "")
    
    let valueString = ""
    let unitString = ""

    // split in unitString and valueString
    for (const c of noWhiteSpace) {
        if (c >= '0' && c <= '9') {
            valueString += c
        } else {
            unitString += c
        }
    }

    const value = parseInt(valueString)
    if (value === undefined) {
        logger.error(valueString + " is not an integer; " + input + " is thus not a valid input.")
    }

    switch(unitString) {
        case "b":
            return (value / 1024 / 1024)
        case "k":
            return (value / 1024)
        case "m":
            return value
        case "g":
            return (1024 * value)
        default:
            logger.error(unitString + " is not a valid unit; " + information_rate + " is thus not a valid input.")
            return 1024
    }
}

module.exports = {
    convertTobps: convertTobps,
    convertToMebibyte: convertToMebibyte
}