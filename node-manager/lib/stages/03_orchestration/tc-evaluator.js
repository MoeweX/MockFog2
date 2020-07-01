const logger = require("../../services/logService.js")("TCEvaluator")

/**
 * Transition-Condition-Evaluator
 * 
 * Add time-based and message-based conditions with #activate, this returns a promise.
 * When new events come in, tell the TCEvaluator through #addEvent
 * Whell all conditions for any next state (or target state) are completed, the promise of #activate resolves with the name of the next state.
 * 
 */
class TCEvaluator {

    constructor() {
        this._activeConditions = {}
        this._timer = []
        this.active = false
    }

    /**
     * Activate the transition condition evaluation. Typically called with await by the orchestration manager.
     * The returned promise resolves to the next state to which the orchestration manager should transition
     * 
     * @param {Array} conditions - comprises message-based and time-based conditions as defined in orchestration.jsonc
     * @returns the name of the next state, when all conditions for the state are met
     */
    async activate(conditions) {
        if (this.active) {
            logger.warn("TCEvaluator is still active")
            return
        }

        this._activeConditions = this._mapConditions(conditions)
        this.active = true

        const tce = this
        return new Promise(resolve => {
            tce.resolve = resolve // resolved through timers or #addEvent when all conditions for any target state are met
            for (const tbc of tce._getTBC()) {
                tce._timer.push(setTimeout(function() {
                    // remove condition as fulfilled
                    tce._removeCondition(tbc)
                    // check whether all conditions are fulfilled
                    if (tce._activeConditions[tbc.next_state].length === 0) {
                        // all conditions fulfilled
                        tce._notifyStateCompletion(tbc.next_state)
                    }
                }, tbc["active-for"]))
            }
        })
    }

    /**
     * Add an event and evaluate whether all conditions for the corresponding target state are met
     * If so, calls #_notifyStageCompletion
     * 
     * @param {String} event - the name of the event
     * @returns true if successful; if the evaluator is not active or the event is not part of active conditions, returns false
     */
    addEvent(event) {
        if (!this.active) {
            logger.warn("TCEvaluator is not active")
            return false
        }

        logger.info("Received event " + event)
        for (const mbc of this._getMBC()) {
            if (mbc.event_name === event) {
                // decrement threshold
                mbc.threshold--

                // if threshold now 0 -> remove and check
                logger.debug(`New threshold for ${mbc.event_name} is ${mbc.threshold}`)
                if (mbc.threshold === 0) {
                    this._removeCondition(mbc)
                    if (this._activeConditions[mbc.next_state].length === 0) {
                        // all conditions fulfilled
                        this._notifyStateCompletion(mbc.next_state)
                    }
                }
                return true
            }
        }
        logger.warn("Event " + event + " is not part of active conditions " + JSON.stringify(this._activeConditions))
        return false
    }

    /**
     * Resolves the promise returned by #activate and returns the state to which the orchestration manager should transition
     * @param targetState - the state returned by the promise
     */
    _notifyStateCompletion(targetState) {
        if (!this.active) {
            logger.warn("TCEvaluator is not active")
        } else {
            logger.info("All conditions for " + targetState + " are fulfilled.")
            // clear all timers (some might still be running)
            for (const timer of this._timer) {
                clearTimeout(timer)
            }
            this._activeConditions = {}
            this.active = false
            this.resolve(targetState)
        }
    }

    /**
     * Creates a map object for the given conditions. Each key maps the target state name to an array of conditions for this state.
     * 
     * @param {Array} conditions - comprises message-based and time-based conditions as defined in orchestration.jsonc
     * @return {Object} targetState -> array of conditions for this state
     */
    _mapConditions(conditions) {
        let conditionMap = {}
        for (const condition of conditions) {
            const arr = Object.is(conditionMap[condition.next_state], undefined) ? [] : conditionMap[condition.next_state]
            arr.push(condition)
            conditionMap[condition.next_state] = arr
        }
        return conditionMap
    }

    _getTBC() {
        const merged = [].concat.apply(Object.values(this._activeConditions)).flat()
        return merged.filter((condition) => {
            return condition.type === "time-based"
        })
    }

    _getMBC() {
        const merged = [].concat.apply(Object.values(this._activeConditions)).flat()
        return merged.filter((condition) => {
            return condition.type === "message-based"
        })
    }

    /**
     * Removes the given condition from this.activeConditions.
     * 
     * @param {Object} condition - the time-based or message-based condition to remove
     */
    _removeCondition(condition) {
        logger.verbose("Condition completed: " + JSON.stringify(condition))
        for (const targetState in this._activeConditions) {
            const conditions = this._activeConditions[targetState]
            const index = conditions.indexOf(condition);
            if (index > -1) { // condition exists
                conditions.splice(index, 1);
                this._activeConditions[targetState] = conditions
                return
            }
        }
        logger.warn("Active conditions does not contain condition " + JSON.stringify(condition))
    }

}

module.exports = TCEvaluator