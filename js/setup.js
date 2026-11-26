const CPP_SELECT_PARENT_ID = "cpp-head-tools-right";
const CPP_REVISION_VALUE_STORAGE_KEY = "cpp-revision-value";

async function setup() {
    const selectEl = await waitForRevisionSelect();
    if (!selectEl) {
        return;
    }

    await setupDesiredOption(selectEl);
    selectEl.addEventListener("change", handleSelectChange);
    console.debug("Finished setup");
}

/**
 * @returns {Promise<HTMLSelectElement>} promise resolving the select when it is added to the DOM
 */
function waitForRevisionSelect() {
    const parentEl = document.getElementById(CPP_SELECT_PARENT_ID);
    if (!parentEl) {
        console.debug("Couldn't find parent element with id: ", CPP_SELECT_PARENT_ID);
        return null;
    }

    return new Promise((resolve, reject) => {
        new MutationObserver((mutationList, observer) => {
            for (const mutation of mutationList) {
                for (const node of mutation.addedNodes) {
                    if (!node.classList.contains("stdrev-select")) {
                        continue;
                    }

                    const selects = node.getElementsByTagName("select");
                    if (selects.length === 0) {
                        reject("Unable to find selects in parent");
                    } else if (selects.length > 1) {
                        reject("Found multiple selects in parent");
                    } else {
                        resolve(selects[0]);
                    }

                    // we already handled the stdrev-select, 
                    // so we know we don't need to keep looking or observing
                    observer.disconnect();
                    return; 
                }
            }
        }).observe(parentEl, {
            childList: true
        });
    })
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
