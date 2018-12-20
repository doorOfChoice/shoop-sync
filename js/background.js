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

chrome.browserAction.onClicked.addListener(function () {
    sendMessageToContentScript({
        cmd: "show"
    }, function (rep) {
        console.log("Have opened!");
    });
});