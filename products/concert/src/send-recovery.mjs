// Loading a save never sends, advances a turn, or changes story/consent state.
export function recoverSend(saved){
 const interrupted=saved.aiMessages.find(m=>m.who==='player'&&m.pending);
 const request=saved.sendRequest||(interrupted?.requestId&&saved.token?{message:interrupted.text,token:saved.token,requestId:interrupted.requestId,retries:1}:null);
 return {...saved,sendRequest:request,aiMessages:saved.aiMessages.map(m=>m.pending?{...m,pending:false,unconfirmed:true}:m)};
}
