const CPP_REVISION_LABEL_STORAGE_KEY = "cpp-revision-value";
const CPP_23_OPTION_LABEL = "C++23";

async function setup() {
    const selectEl = await getRevisionSelectWithRetry(5);
    await setDesiredOption(selectEl);
    selectEl.addEventListener("change", handleRevisionSelectChange);
}

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

function handleRevisionSelectChange(event) {
    const newLabel = event.target.selectedOptions.item(0)?.label;
    if (newLabel) {
        console.debug("User clicked option, storing: " + newLabel);
        browser.storage.sync.set({
            [CPP_REVISION_LABEL_STORAGE_KEY]: newLabel
        });
    }
}

/**
 * Attempts to resolve the revision select, retrying 'triesLeft' times 
 * until it finds it in the document, or throws if out of retries.
 * <p>
 * Without the retry implementation, the extension failed to find the input often. 
 */
async function getRevisionSelectWithRetry(triesLeft) {
    const queryResult = document.querySelector("div.stdrev-select select");
    if (queryResult) {
        return queryResult;
    }

    // couldn't find the input, so retry or throw
    if (triesLeft <= 0) {
        throw new Error("Couldn't find revision select element");
    }

    console.debug("Couldn't find revision select element, retrying");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(getRevisionSelectWithRetry(triesLeft - 1));
        }, 200); // settled on 200 after some informal testing, 100 still resulted in issues
    })
}

setup();
