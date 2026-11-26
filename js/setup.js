const CPP_REVISION_SELECT_PARENT_ID = "cpp-head-tools-right";
const CPP_REVISION_SELECT_QUERY = "div.stdrev-select select";

const CPP_REVISION_VALUE_STORAGE_KEY = "cpp-revision-value";

async function setup() {
    console.debug("Begin setup");
    const selectEl = await waitForRevisionSelect();
    if (!selectEl) {
        console.debug("Couldn't find revision select");
        return;
    }

    await setupDesiredOption(selectEl);
    selectEl.addEventListener("change", handleSelectChange);
    console.debug("Finished setup");
}

/**
 * @returns {Promise<HTMLSelectElement | null>} promise resolving the select when it is added to the DOM, or null if 
 *                                              the parent element couldn't be found or a timeout
 */
async function waitForRevisionSelect(timeoutMs = 10000) {
    const parentEl = document.getElementById(CPP_REVISION_SELECT_PARENT_ID);

    if (!parentEl) {
        console.debug("Couldn't find parent element with id, likely not a relevant page: ", CPP_REVISION_SELECT_PARENT_ID);
        return null;
    }

    // First, see if it's already in the dom
    const fromQuery = parentEl.querySelector(CPP_REVISION_SELECT_QUERY);

    if (fromQuery) {
        console.debug("Found select via DOM query");
        return fromQuery;
    }

    // We will store references to the observer and timeout
    // created in the promise here, so that they are then available
    // in the `.finally` of the promise.
    let observer = null;
    let timeout = null;

    // Kick off the observer, so it intercepts the addition of the select.
    // NOTE: There is no race condition where the select can be added before we begin observing,
    // since the promise executor is executed synchronously during the constructor call
    // as described in the MDN docs here: 
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/Promise#description
    return new Promise((resolve) => {
        observer = new MutationObserver(() => {
            console.debug("Observing addition to parent");

            const fromMutation = parentEl.querySelector(CPP_REVISION_SELECT_QUERY);
            if (!fromMutation) {
                console.debug("No select found in the mutation");
                return;
            }

            console.debug("Found select, resolving");
            resolve(fromMutation);
        });

        timeout = setTimeout(() => {
            console.debug("Timed out waiting for mutation");
            resolve(null);
        }, timeoutMs);

        observer.observe(parentEl, {childList: true, subtree: true});

        console.debug("Deferring to mutation observer");
    }).finally(() => {
        console.debug("Observation promise complete, cleaning up");

        if (observer) {
            observer.disconnect();
        }

        if (timeout) {
            clearTimeout(timeout);
        }
    });
}

/**
 * @param {HTMLSelectElement} selectEl 
 */
async function setupDesiredOption(selectEl) {
    const desiredOptionValue = (
        await browser.storage.sync.get(CPP_REVISION_VALUE_STORAGE_KEY)
    )[CPP_REVISION_VALUE_STORAGE_KEY];

    if (!desiredOptionValue) {
        console.debug("User has no selected value, noop");
        return;
    } else if (selectEl.value === desiredOptionValue) {
        console.debug("Desired value is already selected, nothing to do");
        return;
    }

    console.debug("User has selected value, setting: ", desiredOptionValue);

    const isValidValue = Array.from(selectEl.options)
        .map(option => option.value)
        .includes(desiredOptionValue);

    if (!isValidValue) {
        console.error("Invalid option value, clearing: ", desiredOptionValue);
        await browser.storage.sync.remove(CPP_REVISION_VALUE_STORAGE_KEY);
        return;
    }

    selectEl.value = desiredOptionValue;
    selectEl.dispatchEvent(new Event("change")); // trigger the change event so the page picks up the new value
    console.debug("Set desired value: ", desiredOptionValue);
}

/**
 * @param {Event} event 
 */
function handleSelectChange(event) {
    console.debug("User clicked option, handling");
    const newValue = event.target.value;
    if (newValue) {
        console.debug("User clicked option, storing: " + newValue);
        browser.storage.sync.set({[CPP_REVISION_VALUE_STORAGE_KEY]: newValue});
    }
}

setup().catch(err => console.error("Setup failed:", err));
