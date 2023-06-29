
function startVernieLED() {

    document.getElementById("vernieOutput").innerHTML += "Publisher initializing.\n";

    if (vernieLED === null) {
        vernieLED = new Worker("./thesis_src/rosWorkers/rainbow.js");
    }

    vernieLED.onmessage = onMessageFromWorker;
}

function stopVernieLED() {
    if (vernieLED !== null) {
        vernieLED.terminate();
        vernieLED = null;
    }
    document.getElementById("vernieOutput").innerHTML += "Publisher terminated.\n\n";
}

function clearVernieLED() {
    document.getElementById("vernieOutput").innerHTML = "";
}