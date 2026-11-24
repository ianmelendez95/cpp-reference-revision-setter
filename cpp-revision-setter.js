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

async function getRevisionSelectInputWithRetry(triesLeft) {
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
            resolve(getRevisionSelectInputWithRetry(triesLeft - 1));
        }, 100);
    })
}

async function setCppRevision() {
    const selectInput = await getRevisionSelectInputWithRetry(5);
    selectInput.value = 6; // magic number, option 6 is C++ 23
}

setCppRevision();
