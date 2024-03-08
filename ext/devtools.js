

const tellYourFuckingSelector = function () {
    // This shit for understand how to reach element by querySelector on backend (extension context side)
    // Idk how to reach it in another way
    function getSelector(elm)
    {
        if (elm.tagName === "BODY") return "BODY";
        const names = [];
        while (elm.parentElement && elm.tagName !== "BODY") {
            if (elm.id) {
                names.unshift("#" + elm.getAttribute("id")); // getAttribute, because `elm.id` could also return a child element with name "id"
                break; // Because ID should be unique, no more is needed. Remove the break, if you always want a full path.
            } else {
                let c = 1, e = elm;
                for (; e.previousElementSibling; e = e.previousElementSibling, c++) ;
                names.unshift(elm.tagName + ":nth-child(" + c + ")");
            }
            elm = elm.parentElement;
        }
        return "body>" + names.join(">");
    }

    return { __proto__: null, selector: getSelector($0), };
  };

  function findConflictingProps(cssData) {
    let conflicts = {};
    let cssProps = {};

    cssData.forEach((item, index) => {
        if(item.css) {
            item.css.forEach(css => {
                let propName = css.name.replace('-webkit-', ''); // Remove -webkit prefix
                if(cssProps[propName]) {
                    if(cssProps[propName].value !== css.value) {
                        conflicts[propName] = conflicts[propName] || [];
                        if (cssProps[propName]?.value === css.value) {
                          return
                        }
                        // conflicts[propName].push({
                        //     conflict: `Conflict found for property "${propName}". Previous value was "${cssProps[propName].value}" in styleSheetId "${cssProps[propName].styleSheetId}", new value is "${css.value}" in styleSheetId "${item.styleSheetId}".`,
                        //     styleSheetId: item.styleSheetId,
                        //     value: css.value
                        // });
                        if (conflicts[propName].length === 0 && cssProps[propName].value !== css.value) {
                            conflicts[propName].push(cssProps[propName].value)
                        }
                        if (conflicts[propName][conflicts[propName].length - 1] !== `${css.value}`) {
                            conflicts[propName].push(`${css.value}`);
                        }
                    }
                } else {
                    cssProps[propName] = {
                        value: css.value,
                        styleSheetId: item.styleSheetId
                    };
                }
            });
        }
    });

    return conflicts;
}



let tabId = chrome.devtools.inspectedWindow.tabId
// Create a tab in the devtools area
chrome.devtools.panels.elements.createSidebarPane("CSS Conflicts",
    function(sidebar) {
        // sidebar.setObject({ some_data: "Some data to show" });
        chrome.devtools.panels.elements.onSelectionChanged.addListener(async () => {
            const {root} = await chrome.debugger.sendCommand({ tabId: tabId}, 'DOM.getDocument')
            
            console.log('result3',chrome.devtools.inspectedWindow.eval(`(${tellYourFuckingSelector.toString()})()`, async ({selector}) => {
                const {nodeId} = await chrome.debugger.sendCommand({ tabId: tabId}, 'DOM.querySelector', {
                    nodeId: root.nodeId,
                    selector
                })
                console.log('result', nodeId, selector)

                const css = await chrome.debugger.sendCommand({ tabId: tabId}, 'CSS.getMatchedStylesForNode', {
                    nodeId
                })
                console.log('css', css)

                let workTree = css.matchedCSSRules.map(z => ({
                    styleSheetId: z.rule.styleSheetId, 
                    css: z.rule.style.cssProperties
                  }))
                  
                sidebar.setObject(findConflictingProps(workTree))
            }))
            // console.log('result0', tabId)
            
            // const data2 = await chrome.debugger.sendCommand({ tabId: tabId}, 'DOM.requestNode', {
            //     objectId: data.result.objectId
            // })
            // console.log('result2', data2)

        })
});

// We need to attach debugger, cuz it won't work without it xD
    chrome.tabs.get(tabId, (tab) => {
        if (tabId !== -1) {
            chrome.debugger.detach({tabId: tabId})
        }
    if (tab.url.startsWith('http')) {
        chrome.debugger.attach({ tabId: chrome.devtools.inspectedWindow.tabId }, '1.3', function () {
            chrome.debugger.sendCommand(
                {tabId: tab.id },
                "DOM.enable", {},
            )
            chrome.debugger.sendCommand(
                { tabId: tab.id },
                'CSS.enable',
                {},
                function () {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                }
                }
            );
            });
        
    } else {
        console.log('Debugger can only be attached to HTTP/HTTPS pages.');
    }
});

