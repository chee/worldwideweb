import*as e from"https://esm.sh/@automerge/automerge-repo@2.0.0-alpha.11/slim?bundle-deps";import{BrowserWebSocketClientAdapter as o}from"https://esm.sh/@automerge/automerge-repo-network-websocket@2.0.0-alpha.11?bundle-deps";import{IndexedDBStorageAdapter as a}from"https://esm.sh/@automerge/automerge-repo-storage-indexeddb@2.0.0-alpha.11";window.AutomergeRepo=e,await e.initializeWasm(fetch("https://esm.sh/@automerge/automerge@2.2.7/dist/automerge.wasm"));var r=new e.Repo({storage:new a("bunkbed"),network:[new o("wss://galaxy.observer")],enableRemoteHeadsGossiping:!0});await r.networkSubsystem.whenReady();var t=location.pathname.slice(1,-5),n=r.find(t);window.htmlHandle=n,window.repo=r;var s=!0;n.on("change",(({handle:e,doc:o})=>{s?s=!1:location.reload()}));var l=document.querySelectorAll("link[rel=stylesheet"),m=document.querySelectorAll("script[src");for(var i of m){var d=new URL(i.src);new URLSearchParams(d.search).get("v");var c=d.pathname.slice(1,-3);let e=!0;if(AutomergeRepo.isValidDocumentId(c))r.find(c).on("change",(({handle:o,doc:a})=>{e?e=!1:location.reload()}))}for(const e of l){d=new URL(e.href);new URLSearchParams(d.search).get("v");c=d.pathname.slice(1,-4);let o=!0;if(AutomergeRepo.isValidDocumentId(c)){r.find(c).on("change",(({handle:e,doc:a})=>{o?o=!1:location.reload()}))}else console.error(c)}