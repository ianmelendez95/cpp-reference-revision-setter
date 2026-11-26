const CPP_SELECT_PARENT_ID = "cpp-head-tools-right";
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
 * @returns {Promise<HTMLSelectElement>} promise resolving the select when it is added to the DOM
 */
async function waitForRevisionSelect() {
    const parentEl = document.getElementById(CPP_SELECT_PARENT_ID);

    if (!parentEl) {
        console.debug("Couldn't find parent element with id, likely not a relevant page: ", CPP_SELECT_PARENT_ID);
        return null;
    }

    // Kick off the observer first, so it intercepts the addition of the select
    return new Promise((resolve, reject) => {
        const observer = new MutationObserver((mutationList, observer) => {
            console.debug("Observing addition to parent");
            for (const mutation of mutationList) {
                for (const node of mutation.addedNodes) {
                    if (!node.classList.contains("stdrev-select")) {
                        continue;
                    }

                    console.debug("Observing addition of stdrev-select div");

                    // we are handling the stdrev-select addition, 
                    // so we know we don't need to keep looking or observing
                    observer.disconnect();

                    const selects = node.getElementsByTagName("select");
                    if (selects.length === 0) {
                        reject("Unable to find selects in parent");
                    } else if (selects.length > 1) {
                        reject("Found multiple selects in parent");
                    } else {
                        console.debug("Resolving found select");
                        resolve(selects[0]);
                    }

                    return; 
                }
            }
        });

        observer.observe(parentEl, {childList: true});

        // Immediately try to find it ourselves, accounting for the race condition where the 
        // select was added before our observer could begin watching
        const fromQuery = document.querySelector("div.stdrev-select select");

        if (fromQuery) {
            console.debug("Found select via DOM query");
            observer.disconnect(); // cleanup, and also the reason this promise is not as clean as it could be
            resolve(fromQuery);
            return;
        }

        console.debug("Deferring to mutation observer");
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

setup();
