const CPP_SELECT_PARENT_ID = "cpp-head-tools-right";
const CPP_REVISION_LABEL_STORAGE_KEY = "cpp-revision-value";
const CPP_23_OPTION_LABEL = "C++23";

async function setup() {
    const selectEl = await waitForRevisionSelect();
    await setDesiredOption(selectEl);
    selectEl.addEventListener("change", handleRevisionSelectChange);
}

/**
 * @returns {Promise<HTMLSelectElement>} promise resolving the select when it is added to the DOM
 */
function waitForRevisionSelect() {
    const parentEl = document.getElementById(CPP_SELECT_PARENT_ID);
    if (!parentEl) {
        throw new Error("Couldn't find parent element with id: ", CPP_SELECT_PARENT_ID);
    }

    return new Promise((resolve, reject) => {
        new MutationObserver(mutationList => {
            for (const mutation of mutationList) {
                for (const node of mutation.addedNodes) {
                    if (!node.classList.contains("stdrev-select")) {
                        continue;
                    }

                    const selects = node.getElementsByTagName("select");
                    if (selects.length === 0) {
                        reject("Unable to find selects in parent");
                        return;
                    }

                    if (selects.length > 1) {
                        reject("Found multiple selects in parent");
                        return;
                    }

                    resolve(selects[0]);
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
async function setDesiredOption(selectEl) {
    const desiredOptionLabel = (
        await browser.storage.sync.get(CPP_REVISION_LABEL_STORAGE_KEY)
    )[CPP_REVISION_LABEL_STORAGE_KEY];

    if (!desiredOptionLabel) {
        return;
    }

    const desiredOption = Array.from(selectEl.options).find(option => 
        option.label === desiredOptionLabel
    );
    if (!desiredOption) {
        console.warn("Unable to find the desired option: ", desiredOptionLabel);
        return;
    }

    selectEl.value = desiredOption.value;
    selectEl.dispatchEvent(new Event("change")); // trigger the change event so the page picks up the new value
}

/**
 * @param {Event} event 
 */
function handleRevisionSelectChange(event) {
    const newLabel = event.target.selectedOptions.item(0)?.label;
    if (newLabel) {
        console.debug("User clicked option, storing: " + newLabel);
        browser.storage.sync.set({
            [CPP_REVISION_LABEL_STORAGE_KEY]: newLabel
        });
    }
}

setup();
