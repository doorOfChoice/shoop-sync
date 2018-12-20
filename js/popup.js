window.onload = function () {
    console.log("yes!!!");
    function sendMessageToContentScript(message, callback)
    {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
        {
            chrome.tabs.sendMessage(tabs[0].id, message, function(response)
            {
                if(callback) callback(response);
            });
        });
    }
    sendMessageToContentScript({
        cmd: "show"
    }, function (rep) {
        console.log("Have opened!");
    });
};
