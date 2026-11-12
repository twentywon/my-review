if(window.TasteBridge){
 window.TasteNative={request:(id,action,payload)=>TasteBridge.postMessage(JSON.stringify({id,action,payload:JSON.parse(payload)}))};
 TasteBridge.onmessage=event=>{const response=JSON.parse(event.data);window.tasteNativeResult?.(response.id,JSON.stringify(response.result));};
}
