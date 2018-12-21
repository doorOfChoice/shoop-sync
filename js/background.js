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

chrome.runtime.onMessage.addListener(function (req, sender, sRep) {
    console.log(req);
    chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: 'icon.png',
        title: req.title,
        message: req.message
    });
});

chrome.browserAction.onClicked.addListener(function () {
    sendMessageToContentScript({
        cmd: "show"
    }, function (rep) {
        console.log("Have opened!");
    });
});