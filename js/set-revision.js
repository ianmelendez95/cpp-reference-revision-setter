const CPP_23_OPTION_LABEL = "C++23";

async function setCppRevision() {
    const selectInput = await getRevisionSelectInputWithRetry(5);
    const cpp23Value = getRevisionOptionValue(selectInput, CPP_23_OPTION_LABEL);

    selectInput.value = cpp23Value;
    selectInput.dispatchEvent(new Event("change")); // trigger the change event so the page picks up the new value
}

/**
 * Attempts to resolve the revision select, retrying 'triesLeft' times 
 * until it finds it in the document, or throws the last error.
 * <p>
 * Without the retry implementation, the extension failed to find the input
 * fairly reliably. Ironically, with the async implementation, it seems to 
 * always find it on the first try now. Perhaps just by deferring to the event loop
 * the DOM gets to fully resolve and the select is available to the extension.
 */
async function getRevisionSelectInputWithRetry(triesLeft) {
    const selectInputResult = document.querySelector("div.stdrev-select select");
    if (selectInputResult) {
        return selectInputResult;
    }

    // couldn't find the input, so retry or throw
    if (triesLeft <= 0) {
        throw new Error("Couldn't find revision select element");
    }

    console.info("Couldn't find revision select element, retrying");
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(getRevisionSelectInputWithRetry(triesLeft - 1));
        }, 200);
    })
}

function getRevisionOptionValue(selectEl, optionLabel) {
    const options = selectEl.getElementsByTagName("OPTION");
    for (const option of options) {
        if (option.label === optionLabel) {
            return option.value;
        }
    }

    throw new Error("Couldn't find optional label: " + optionLabel);
}

setCppRevision();
