/**
 * Attempts to resolve the revision select, retrying 'triesLeft' times 
 * until it finds it in the document, or throws the last error.
 * <p>
 * Without the retry implementation, the extension failed to find the input
 * fairly reliably. Ironically, with the async implementation, it seems to 
 * always find it on the first try now. Perhaps just by deferring to the event loop
 * the DOM gets to fully resolve and the select is available to the extension.
 */
async function findRevisionSelectInputWithRetry(triesLeft) {
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
            resolve(findRevisionSelectInputWithRetry(triesLeft - 1));
        }, 100);
    })
}

async function setCppRevision() {
    const selectInput = await findRevisionSelectInputWithRetry(5);
    selectInput.value = 6; // magic number, option 6 is C++ 23
}

setCppRevision();
