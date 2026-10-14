export const CAST = {
 nora:{name:'Nora',role:'Co-writer · the other half of the song',image:'nora-guarded',listening:'nora-listening'},
 lia:{name:'Lia',role:'Singer · one step away from going solo',image:'lia-guarded',listening:'lia-receptive'},
 bruno:{name:'Bruno',role:'Stage manager · cues the show on your call',image:'bruno',listening:'bruno'}
};
export const MOODS = {
 guarded:{image:'lia-guarded',label:'Holding back'},
 receptive:{image:'lia-receptive',label:'Considering your offer'},
 hurt:{image:'lia-hurt',label:'That hit a nerve'},
 firm:{image:'lia-firm',label:'Drawing a line'}
};
export const OPENING = [
 {who:'',text:'Five minutes before the broadcast ends.',cue:'Applause carries through the curtain. Nora leaves her microphone on a flight case.'},
 {who:'bruno',text:'We have time for one final performance. Lia can premiere her new song alone, or you two can sing your best-known song together. We can’t fit both.'},
 {who:'nora',text:'Then she premieres her song. I’m not going on.'},
 {who:'lia',text:'Don’t do this now. We were going to talk afterwards.'},
 {who:'nora',text:'After what? The song, or the solo tour you’ve already planned?',cue:'Lia looks at the folded running sheet in Nora’s hand.'},
 {who:'bruno',text:'You’re the producer. Settle who’s going on; I’ll cue the stage crew. I can’t make them say yes.'}
];
// Reading time includes action cues; automatic scenes never require rapid reading.
export function openingDuration(beat){const words=[beat.text,beat.cue||''].join(' ').trim().split(/\s+/).length;return Math.max(12000,words*400+4000);}
export const NODES = {
 N0:{who:'nora',line:'If I sing with her, tomorrow everyone will say nothing has changed. It has.',choices:[
 ['meaning','What don’t you want the audience to assume?','That I’m staying. I don’t want one last song to sound like a promise of all the ones after it.','N1',['boundary']],
 ['sheet','What did you see on the running sheet?','“Lia. Solo tour.” I was still waiting for us to decide together. She said, “After the concert, we’ll decide what to do with us.”','N2',['phrase']],
 ['goodbye','If it were a real goodbye, would you want to sing?','Maybe. But a goodbye isn’t singing, then going back to waiting in the dressing room.','N1',['boundary']]]},
 N1:{who:'nora',line:'I can sing one last song. I can’t keep pretending we haven’t decided anything.',choices:[
 ['terms','What conditions can I take back to her?','She’s losing a partner, not an angry substitute. That song is mine too. And she cannot announce that we’re staying together. You can tell her that.','N3',['offer']],
 ['private','Do you want to say it in front of everyone?','If she acknowledges it privately and doesn’t sell a reunion, maybe it doesn’t have to be tonight. But tomorrow, we review what we say together.','N3',['private']],
 ['promise','I promise she’ll reconsider doing the tour together.','If she really will reconsider, I’ll hear the offer. But don’t get me onstage just to tell me it was already decided.','N3',['promise']]]},
 N2:{who:'nora',line:'I heard a door being left open.',choices:[
 ['residency','What did you put on hold for that conversation?','A residency. I let the deadline pass. She knew I’d been offered it. I didn’t tell her I turned it down.','N2b',['residency']],
 ['departure','What do you need to decide tonight, even if you don’t sing?','That I’m leaving the project. That this time, “afterwards” isn’t another way of asking me to wait.','N1',['boundary']],
 ['respect','I can stand up for that without bringing in anything personal.','Yes. You don’t need to tell my life story to respect what I’m asking for.','N1',[]]]},
 N2b:{who:'nora',line:'And I wasn’t only waiting for a tour.',choices:[
 ['kiss','If you want to tell me, I’m listening.','We kissed. Two years ago. For me, it didn’t end there. For her… I don’t know. This stays here, please.','N1',['kiss']],
 ['enough','You don’t have to tell me more for me to take you seriously.','Thank you. Start by not promising me another wait.','N1',[]]]},
 N3:{who:'nora',line:'I want to know what’s really being offered before I pick up that microphone again.',choices:[
 ['relay','I’ll share only your professional conditions.','All right. One last song. Not a yes to carrying on.','hub',['relay'],'offer'],
 ['hear','First, I want to hear what she’s offering.','Okay. But don’t tell her I’ve agreed.','hub',[]],
 ['repair','I promised too much about the tour. I can’t guarantee it.','Then take it back. If I sing, I want it understood as a farewell. I won’t leave here with two versions again.','hub',['repair'],'promise']]},
 L0:{who:'lia',line:'I’ve spent months getting this single ready. But if I go on alone now, it looks like I’ve erased her. If I don’t go on, it looks like I can’t exist without her.',choices:[
 ['chronology','Had you already decided on the tour when you spoke?','I’d authorized the preparations. Before that conversation, yes. I wanted to tell her after the concert. I said “us” because I didn’t know how to say “me.”','L1',['date','phrase','acknowledgement']],
 ['cost','What do you lose if the single doesn’t premiere tonight?','This broadcast. The band, the press, the premiere, all together. The song won’t disappear tomorrow. But this moment will.','L1',['cost']],
 ['keep','What do you want to keep with her?','The way she looks at me before we start. She knows when I won’t reach a note. But I can’t offer to keep everything the same.','L1',['dependence']]]},
 L1:{who:'lia',line:'I don’t know how to let her go without making it look like I don’t care.',choices:[
 ['listen','I’ll listen to what she would be willing to do.','Do that. But don’t promise her a tour I’m not offering.','hub',[]],
 ['relay_lia','Nora is offering one last song, without staying together.','One last song? I thought she’d only sing if I stopped the tour. Okay. Then we need to talk about what we’d say.','hub',['relay'],'offer'],
 ['plan','I want to work out a plan with you.','Come here. Tell me what you’re proposing, knowing what we’d be giving up.','brief',[]]]},
 B0:{who:'bruno',line:'The song, who sings it, and what we say beforehand. Give me that and I can work with it.',choices:[
 ['date','When was the tour authorized?','Three days ago. Look at the timestamp on this preparation order. I wasn’t in the conversation they had afterwards.','B1',['date']],
 ['encore','Could they sing off air?','The venue will let us do one short song afterwards. People here would see it. People at home wouldn’t. And I need both of them to agree.','B1',['encore']],
 ['ready','Keep both entrances ready.','Ready, yes. Only one is going on air.','hub',[]]]},
 B1:{who:'bruno',line:'I’m keeping both entrances ready. You need an agreement.',choices:[
 ['contrast','I want to ask Lia about the timing of that order.','Talk to her. The order doesn’t tell you the whole conversation.','C1',[],'contradiction'],
 ['done','I have enough to propose an ending.','Once it’s agreed, give me the cue.','hub',[]]]},
 C1:{who:'lia',line:'That it was still open. I know. I didn’t tell her something I could have told her. But I can’t offer her a life I don’t want now.',choices:[
 ['own','You can own that in front of her.','Yes. Without promising the opposite tomorrow.','hub',['acknowledgement']],
 ['tonight','Right now, we need to decide what you can offer tonight.','Let’s talk.','brief',['acknowledgement']]]},
 C2:{who:'nora',line:'I need to hear her say it. But that is different from asking me not to ruin her concert.',choices:[
 ['include','I’ll make that part of my proposal.','I want a clear ending. Not something else that depends on tomorrow.','N1',['ackRelayed']],
 ['norescue','I won’t ask you to go on just to save her night.','I might want to sing for myself too. Don’t take that possibility away from me.','N1',['ackRelayed']]]}
};
export const FACTS = {
 boundary:['One last song cannot promise a future together.','Nora'],
 offer:['Nora allows her professional conditions to be shared: a farewell, credit, and no promise to continue.','Nora · conditional offer'],
 phrase:['“After the concert, we’ll decide what to do with us.”','A conversation about their future'],
 date:['The solo tour was authorized three days ago, before that conversation.','Preparation order / Lia'],
 residency:['Nora let a residency deadline pass while waiting for the conversation. Lia doesn’t know she turned it down.','Nora · private conversation'],
 kiss:['A kiss two years ago. Nora still sees a possibility. She asked you to keep it confidential.','Nora · confidential'],
 private:['Nora would consider a private separation if they review tomorrow’s statement together.','Nora · condition'],
 cost:['The single would lose tonight’s TV premiere. The song would still exist tomorrow.','Lia'],
 dependence:['Lia wants to keep their musical closeness, but cannot offer to keep everything the same.','Lia'],
 encore:['An off-air encore is possible if both agree. Viewers at home wouldn’t see it.','Bruno'],
 acknowledgement:['Lia admits she left a door open after she had already begun planning the solo tour.','Lia']
};
export const PROGRAMS = {
 solo:{title:'Lia’s single',short:'Solo premiere',cost:'Their shared farewell stays off the broadcast.',intro:'Tonight I’m starting a different chapter. Thank you, Nora, for the songs we made possible together.',terms:['Lia performs alone and premieres the single.','Honest thanks to Nora as co-writer.','No excuses, endorsement or reconciliation attributed to Nora.'],image:'ending-solo'},
 public:{title:'A farewell together',short:'Farewell duet',cost:'The single loses tonight’s premiere. The separation becomes public.',intro:'This is the first song we wrote together. Tonight we’re closing that chapter. Thank you, Nora.',terms:['Their shared song fills the four-minute slot.','A public professional farewell, without intimate details.','Shared credit and no promise to continue the duo.'],image:'ending-duet'},
 private:{title:'The song, without announcing the end',short:'Duet · private separation',cost:'The single is left out. The audience won’t know about the separation until tomorrow.',intro:'We wrote this song together. Nora, it’s as much yours as mine.',terms:['Lia acknowledges privately, now, that Nora is leaving.','An honest, neutral introduction; no promise to continue.','Both review tomorrow’s statement before it is published.'],image:'ending-duet'}
};
