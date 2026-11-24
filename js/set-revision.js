function findRevisionSelectInput() {
    const selectDivs = document.getElementsByClassName("stdrev-select");
    if (selectDivs.length === 0) {
        return "No select div found";
    } else if (selectDivs.length > 1) {
        return "Multiple select divs found";
    }

    const selectInputs = selectDivs[0].getElementsByTagName("SELECT");
    if (selectInputs.length === 0) {
        return "No select input found";
    } else if (selectInputs.length > 1) {
        return "Multiple select inputs found";
    }

    return selectInputs[0];
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
async function findRevisionSelectInputWithRetry(triesLeft) {
    const selectInputResult = findRevisionSelectInput();
    if (typeof selectInputResult !== 'string') {
        return selectInputResult;
    }

    // couldn't find the input, so retry or throw
    if (triesLeft <= 0) {
        throw new Error(selectInputResult)
    }

    console.log("Failed to find select div, retrying");
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
