// Navigate the same explicit reply modes a player uses; no state injection here.
async function editReply(page){
 if(!await page.locator('#message').count())await page.getByRole('button',{name:/^(Type instead|Review saved draft)$/}).click();
 await page.locator('#message').waitFor();
}
async function talkMode(page){
 if(await page.getByRole('button',{name:'Back to Talk',exact:true}).count())await page.getByRole('button',{name:'Back to Talk',exact:true}).click();
}
async function openOptions(page){await page.getByRole('button',{name:'Conversation options',exact:true}).click();}
async function checkNotes(page){await openOptions(page);await page.getByRole('button',{name:'Check notes',exact:true}).click();}
module.exports={editReply,talkMode,openOptions,checkNotes};
