class MessageStack {
    constructor(size) {
        this.element = [];
        this.size = size
        this.top = -1
    }
    
    isEmpty() {
        return (this.element.length == 0)
    }
    
    push(element) {
        this.top++;
        // Wrap around
        this.top = (this.top < this.size) ? this.top : 0;
        this.element[this.top] = element;
    }
    
    pop() {
        // LIFO : get most recent
        if (this.isEmpty()) return null;
        const value = this.element[this.top]
        this.element[this.top] = null;
        return value
    }
    
    clear() {
        this.element = new Array()
        this.top = -1
    }
}


const topicMap = {};
let talker = null;
let listener = null;

const publisherRoles = ["publisher", "service_server", "action_server"];
const subscriberRoles = ["subscriber", "service_client", "action_client"];

  
// Receive messages from workers
let onMessageFromWorker = function( event ) {
    switch( event.data.command )
    {
        case "register":
            // console.log("REGISTERING: ", event.data.topic, event.data.role);
            if (!(event.data.topic in topicMap)) {
                topicMap[event.data.topic] = {
                    messages: new MessageStack(10),
                    publishers: [],
                    subscribers: [],
                }
            }


            if (publisherRoles.includes(event.data.role)) {
                topicMap[event.data.topic].publishers.push(event.data.gid);
            } 
            else if (subscriberRoles.includes(event.data.role)) {
                topicMap[event.data.topic].subscribers.push(event.data.gid);
            }
            else {
                console.log("INVALID ROLE ", event.data.role);
            }
            
            break;

            case "deregister":

            let gidIndex = "";
            if (publisherRoles.includes(event.data.role)) {
                gidIndex = topicMap[event.data.topic].publishers.indexOf(event.data.gid);
                // console.log("DEREG PUB:", gidIndex, event.data.role, event.data.topic);
                if (gidIndex > -1) {
                    topicMap[event.data.topic].publishers.splice(gidIndex, 1);
                };
                // if (topicMap[event.data.topic].publishers.length == 0) {
                //     delete topicMap[event.data.topic];
                // }
            } 
            else if (subscriberRoles.includes(event.data.role)) {
                gidIndex = topicMap[event.data.topic].subscribers.indexOf(event.data.gid);
                // console.log("DEREG SUB:", gidIndex, event.data.role, event.data.topic);
                if (gidIndex > -1) {
                    topicMap[event.data.topic].subscribers.splice(gidIndex, 1);
                };
                // if (topicMap[event.data.topic].subscribers.length == 0) {
                //     delete topicMap[event.data.topic];
                // }
            }
            else {
                console.log("INVALID GID ", event.data.gid);
            }

            break;

        case "publish":
            case "publish":
            // Remove new lines to prevent truncation
            let pubMsg = event.data.message.replaceAll(/\n/g, ", ");
            topicMap[event.data.topic].messages.push(pubMsg);
            break;

        case "retrieve":
    
            let msgPopped = topicMap[event.data.topic].messages.pop();
            
            if (msgPopped !== null) {
                // TODO: broadcast to all subscribers
                if (listener !== null) { 
                    listener.postMessage({
                            topic: event.data.topic,
                            message: msgPopped
                        }); 
                };
            } 
            
            break;

        case "console":
            let rawMessage = event.data.message;
            // Remove end chars
            let msg = rawMessage.substr(4, rawMessage.length - 8);
            let talkerOutput = document.getElementById(event.data.role + "Output");
            talkerOutput.scrollTop = talkerOutput.scrollHeight;
            talkerOutput.innerHTML += msg + "\n";
            break;
    }
}


// PUBLISHER 

function startTalker() {

    document.getElementById("talkerOutput").innerHTML += "Publisher initializing.\n";

    if (talker === null) {
        talker = new Worker("/presentations/thesis_src/rosWorkers/talker.js");
    }

    talker.onmessage = onMessageFromWorker;
}

function stopTalker() {
    talker.terminate();
    talker = null;

    // Terminate subscriber to reestablish connection at restart
    if (listener !== null) { stopListener(); }

    document.getElementById("talkerOutput").innerHTML += "Publisher terminated.\n\n";
}

function clearTalker() {
    document.getElementById("talkerOutput").innerHTML = "";
}


// SUBSCRIBER

function startListener() {

    document.getElementById("listenerOutput").innerHTML += "Subscriber initializing.\n";

    if (listener === null) {
        listener = new Worker("/presentations/thesis_src/rosWorkers/listener.js");
    }

    listener.onmessage = onMessageFromWorker;
}

function stopListener() {
    if (listener !== null) {
        listener.terminate();
        listener = null;
    }
    document.getElementById("listenerOutput").innerHTML += "Subscriber terminated.\n\n";
}

function clearListener() {
    document.getElementById("listenerOutput").innerHTML = "";
}
