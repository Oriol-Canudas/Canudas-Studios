export const CAST = {
 nora:{name:'Nora',role:'Songwriter & co-vocalist · a core member of the band',image:'nora-guarded',listening:'nora-listening'},
 lia:{name:'Lia',role:'Lead singer & frontwoman',image:'lia-guarded',listening:'lia-receptive'},
 bruno:{name:'Bruno',role:'Stage manager · waiting for your cue',image:'bruno',listening:'bruno'}
};
export const MOODS={guarded:{image:'lia-guarded',label:'Holding back'},receptive:{image:'lia-receptive',label:'Considering your offer'},hurt:{image:'lia-hurt',label:'That hit a nerve'},firm:{image:'lia-firm',label:'Drawing a line'}};
export const OPENING=[
 {who:'',text:'The main set is over. Lia and Nora step offstage together.',cue:'Applause builds into stamping feet. The crowd wants the encore.'},
 {who:'',text:'Lia fronts the band. Nora co-wrote—and sings—many of the songs the crowd knows by heart.',cue:'They always return together for the encore: their most famous shared song.'},
 {who:'',text:'BOOKING: “Dates locked. The new tour goes ahead without Nora, as agreed. Ready to announce.”',cue:'Lia puts her phone on a flight case. The screen lights up. Nora reads it.'},
 {who:'nora',text:'Without Nora. As agreed. You said we’d talk about the next tour after tonight.'},
 {who:'lia',text:'We were going to.'},
 {who:'nora',text:'About what? You’ve already told them I’m not coming.',cue:'She puts her microphone down. The chant gets louder.'},
 {who:'bruno',text:'They’re calling for the encore. Are you both ready?'},
 {who:'nora',text:'You can take the band on without me. But don’t ask me to sing tonight as if that’s a decision we made together. I’m not going back out.'},
 {who:'lia',text:'It’s our song. We always do it together.'},
 {who:'nora',text:'You should have thought about that before planning the next tour without me.',cue:'Nora moves towards the dressing room. Lia stays by the curtain.'},
 {who:'bruno',text:'Your call on the encore. I can hold the lights. I need to know who’s going back out.'}
];
export function openingDuration(beat){const words=[beat.text,beat.cue||''].join(' ').trim().split(/\s+/).length;return Math.max(12000,words*400+4000);}
// [id, player words, character response, next node, discoveries/events, availability gate]
export const NODES={
 N0:{who:'nora',line:'I’ve written so many of those songs with her. I’ve sung them beside her every night. And now I’m reading that I’m not on the next tour. She still expects me to go back out and sing the one that means the most to us.',choices:[
 ['meaning','What would singing it tell the audience?','That we’re still choosing this together. They don’t see the message on her phone. They see us.','N1',['boundary']],
 ['sheet','What did she tell you before tonight?','Two days ago: “After the concert, we’ll talk about you coming on the next tour.” I thought she meant it was still possible.','N2',['phrase']],
 ['goodbye','Are you refusing the encore, or refusing to keep working with her?','I won’t keep finding out where I stand from her phone. I haven’t decided whether I want to give up this song tonight. It’s mine too.','N1',['boundary']]]},
 N1:{who:'nora',line:'I might want to sing it. I won’t sing a promise she doesn’t mean.',choices:[
 ['terms','What would make it an encore you could mean?','She tells me I’m not on the next tour, herself. She says we wrote this together. And she doesn’t make the encore sound like a promise that I’ll be back.','N3',['offer']],
 ['private','Would you need the audience to know tonight?','Not necessarily. She tells me before we go on. No taking my hand for the crowd. Tomorrow we agree what to tell people. You can offer her that. I’m not saying yes yet.','N3',['private']],
 ['promise','I can get her to take you on the tour.','Has she said that? Because if you’re asking me to go on for that reason, I need it to be real.','N3',['promise']]]},
 N2:{who:'nora',line:'This didn’t start with the message. We haven’t been able to say anything straight to each other for weeks.',choices:[
 ['changed','What changed between you?','Eva started coming to the shows. Lia was happy. I stopped staying after rehearsals. It was easier to leave than keep watching them.','N2a',['eva']],
 ['interpretation','Lia may have thought you didn’t want the project anymore.','I wanted to keep singing with her. I don’t want to keep working like this. I was angry with her, and I let it come out every time we played.','N2b',['professional']],
 ['respect','We can stay with what you need tonight.','Then don’t ask me to look at her the way I always have, and call it business as usual.','N1',[]]]},
 N2a:{who:'nora',line:'It wasn’t only the singing I wanted to keep. I just never found a way to tell her that.',choices:[
 ['love','What couldn’t you tell her?','That I love her. Not just the music. She hasn’t promised me that. I know. Please don’t take this to her.','N2b',['love','professional'],null,'She looks towards the door, then back.'],
 ['enough','You don’t have to tell me for me to take you seriously.','Then take this seriously: I still cared about the music. I just didn’t know how to be beside her anymore.','N2b',['professional']]]},
 N2b:{who:'nora',line:'I kept finding something wrong with every rehearsal. Her timing. My entrances. Things I’d never cared about before. I made it hard to be in the room with me.',choices:[
 ['permission','Can I tell her you still believed in the music?','Yes. That, and that I know I hurt her at rehearsals. You can tell her those things. The rest stays here.','N3',['permission','professional']],
 ['accountability','You can own that without accepting how she handled the tour.','I can. I was unfair in the room. She still let me believe the decision was open. Both happened.','N1',['professional']],
 ['tonight_nora','For tonight, let’s work out what you can honestly agree to.','One last song might be possible. A future she doesn’t want isn’t.','N1',[]]]},
 N3:{who:'nora',line:'Bring me what she’s actually willing to do. Don’t come back with what you hope she means.',choices:[
 ['repair','I promised you a place on the tour. She hasn’t agreed. I take that back.','Then don’t ask me to trust that promise again. Bring me an offer I can hear from her.','hub',['repair'],'promise'],
 ['relay_context','I’ll tell her you still cared about the music, and let you explain the rest.','Thank you. Let that be all you tell her.','hub',['deliver_context'],'permission'],
 ['relay_private','I’ll take her your offer: an ending agreed privately, space onstage, and a joint statement tomorrow.','Before we sing. Not a promise to explain it afterwards.','hub',['deliver_private'],'private'],
 ['relay','I’ll take her your conditions for tonight’s encore.','A possible encore. Not my agreement yet.','hub',['deliver_offer'],'offer'],
 ['hear','I’ll hear her out before I make any promises.','Good. I’ll be here.','hub',[]]]},
 L0:{who:'lia',line:'We just played so many of the songs we wrote together. They want us back for the one everyone sings. She saw the message, put down her mic, and now I don’t know how to get through it without her.',choices:[
 ['why','Why did you decide to take the band on tour without Nora?','Every song we tried to work on turned into a fight. She’d leave before we’d finished. I thought she’d stopped wanting to make music with me. I wanted to keep going, so I started planning a way to do that without her.','L2',['lia_interpretation']],
 ['chronology','Had you already decided when you said you’d talk after the show?','I’d told Bruno to reserve the dates without her. Three days ago. I hadn’t told Nora. Saying we’d talk about her coming bought me time. It wasn’t fair to her.','L1',['date','phrase','acknowledgement']],
 ['cost','What would change if you did the encore without her?','I can sing the melody. The band can play it. But she wrote the answering line, and it’s her voice everyone waits for before the last chorus. Getting through the song isn’t the same as it sounding right.','L1',['cost']]]},
 L2:{who:'lia',line:'I couldn’t tell whether she was angry with me or finished working with me. I stopped asking. That was easier.',choices:[
 ['asked','What did you actually ask her?','Whether she still wanted to do this. She said, “Do what you want.” I heard permission. Maybe I wanted to.','L1',['reported_exchange']],
 ['eva_lia','What else changed between you?','I started seeing Eva. I was happy. Nora got further away. I thought she disliked Eva, or the time I spent with her. I didn’t ask the question underneath that.','L1',['eva']],
 ['hiding','Being hurt by her doesn’t make that message a conversation.','No. It doesn’t. I decided what I needed, then let her believe I hadn’t.','L1',['acknowledgement']]]},
 L1:{who:'lia',line:'I don’t want to promise another tour together just to get through the last chorus.',choices:[
 ['goodbye_lia','If she sings, can you accept that it may be goodbye?','I can hear the word. Saying it in front of everyone is different. Once I say it out there, it’s everyone’s business. I haven’t even managed to say it to her.','L3',['public_cost']],
 ['without','You could do the encore with the band, without Nora, and still acknowledge her.','Yes. But not with some excuse about where she is. If she’s not there, that’s something I’ll have to stand in.','L3',['solo_feasible']],
 ['plan','I want to work out an offer with you.','Then tell me what you’re asking me to give up. Not just how to get her through the door.','brief',[]]]},
 L3:{who:'lia',line:'I can keep the band going without her. That doesn’t mean I can replace what she brings to it. I don’t know how to stand beside her tonight and admit what we’re losing.',choices:[
 ['listen','I’ll ask what she would want from that last song.','Ask her. Don’t tell her I’ve agreed to put her on the next tour.','hub',[]],
 ['relay_lia','She would consider the encore, with credit and no promise about another tour.','The encore. Without asking me to put her back on the next tour. We need to agree what we say before it.','hub',['deliver_offer'],'offer'],
 ['concrete','Let’s make the proposal concrete.','All right. What do you want me to say to her?','brief',[]]]},
 LC:{who:'lia',line:'She said she still wanted the music? Then we were both waiting for the other one to say it. I told myself I was only finishing something she’d already left.',choices:[
 ['lc_own','You can tell her that without asking her to stay.','Yes. I can own what I decided.','L1',['acknowledgement']],
 ['lc_excuse','It explains the decision. It doesn’t excuse hiding it.','I know. She needs to hear both.','L1',['acknowledgement']],
 ['lc_offer','What can you offer her tonight, knowing that?','I don’t know yet. I can admit what I did. Standing beside her for a goodbye is something else.','brief',['acknowledgement']]]},
 B0:{who:'bruno',line:'The set’s done. The band can go back out when you give the cue. I need to know whether Nora’s with them, Lia takes the vocals herself, or we bring the house lights up.',choices:[
 ['date','When did the next tour stop including Nora?','Three days ago, Lia asked me to hold the dates with a lineup that didn’t include Nora. Today’s message confirms that plan. I wasn’t there when she spoke to Nora.','B1',['date']],
 ['rehearsal','What have you seen between them lately?','At soundcheck last week, Nora cut the song halfway through and walked out. Lia finished the run alone. I heard the music stop. I don’t know what either of them meant by it.','B1',['rehearsal']],
 ['feasible','Can the band do the encore without Nora?','The band can play it. Lia can take the lead on her own, but Nora’s part is a big piece of that arrangement. It’ll be a different ending. Don’t put words in Nora’s mouth. If they sing together, both need to agree what gets said.','B1',['solo_feasible']]]},
 B1:{who:'bruno',line:'I’ll keep both microphones ready. You tell me what they’ve actually agreed.',choices:[
 ['contrast','I want to ask Lia when she decided Nora wasn’t coming.','Ask her. A date on a production order doesn’t tell you why she chose it.','C1',[],'contradiction'],
 ['prepare','We need to settle the words before the cue.','Good. I’ll stay on standby.','brief',[]],
 ['done','Keep holding. I’m going back to them.','I’m here.','hub',[]]]},
 C1:{who:'lia',line:'That there was still a choice. I know. I thought if I got us through tonight, I’d find a better way to tell her. There wasn’t one.',choices:[
 ['own','Tell her that before you ask her to sing.','I can. Without making her responsible for forgiving me tonight.','hub',['acknowledgement']],
 ['tonight','Then let’s decide what you can honestly offer now.','All right. No promise about a tour I haven’t offered.','brief',['acknowledgement']]]},
 C2:{who:'nora',line:'I need to hear that from her. But don’t turn it into a reason I owe her the last song.',choices:[
 ['include','You don’t. I’ll ask her to acknowledge it without asking for anything back.','Then we can start there.','N1',[]],
 ['norescue','You could still want to sing it for yourself.','I could. That’s the part I haven’t given her an answer to.','N1',[]]]}
};
export const FACTS={
 boundary:['The encore cannot promise a future Nora has not agreed to.','Nora'],
 offer:['Nora permits sharing her conditions: acknowledgment before singing, shared credit, no promise of another tour. Not consent.','Nora · conditional offer'],
 private:['Nora would consider a private acknowledgment before singing, space onstage, and a jointly reviewed statement tomorrow. You may offer it. Not consent.','Nora · conditional offer'],
 phrase:['Two days ago Lia said they would talk about Nora coming on the next tour after the concert.','Nora / Lia'],
 date:['Dates for a lineup without Nora were held three days ago. Today’s message confirms that plan.','Lia / Bruno'],
 eva:['Lia has started seeing Eva. Nora says it became harder to stay after rehearsals.','Their accounts'],
 love:['Nora is in love with Lia. She asked you not to tell her.','Nora · confidential'],
 professional:['Nora still believed in the music. She accepts that she made rehearsals difficult.','Nora’s account'],
 permission:['Nora permits sharing her professional explanation. Permission is not delivery.','Nora · permission'],
 lia_interpretation:['Lia took Nora’s distance as a sign she no longer wanted the project. An interpretation, not Nora’s decision.','Lia’s account'],
 reported_exchange:['Lia heard “Do what you want” as permission. That was not an agreement about the tour.','Lia’s account'],
 acknowledgement:['Lia admits she kept the decision from Nora after she had already planned the tour without her.','Lia'],
 cost:['Lia can take the melody with the band. Nora’s answering line and creative presence cannot simply be replaced.','Lia'],
 solo_feasible:['The band can return without Nora. Her absence changes the arrangement and the ending.','Bruno / Lia'],
 public_cost:['A public acknowledgment means losing control of when the next-tour change becomes everyone’s business.','Lia'],
 rehearsal:['Bruno saw Nora stop an unfinished soundcheck and leave. He does not know why.','Bruno · observation']
};
export const PROGRAMS={
 solo:{title:'The encore without Nora',short:'Band & Lia · without Nora',cost:'One of the voices that shaped the song is missing.',intro:'Nora and I wrote this song together. She won’t be joining me for it tonight.',terms:['The same shared song, with the band and Lia; Nora does not perform.','Lia names Nora as co-writer.','No excuse, endorsement or private explanation attributed to Nora.'],image:'ending-solo'},
 public:{title:'An encore with public acknowledgment',short:'Shared encore · public acknowledgment',cost:'The audience learns Nora won’t return for the next tour. They no longer control who asks about it tomorrow.',intro:'Nora and I wrote this together. We always come back for this one. Nora won’t be joining the next tour. Tonight, we’d like to sing it together for you.',terms:['Lia acknowledges her earlier decision to Nora before singing.','Both sing the same encore song, with shared credit.','With Nora’s agreement, Lia tells the audience Nora is not on the next tour. No future promise or intimate disclosure.'],image:'ending-duet'},
 private:{title:'An encore after a private acknowledgment',short:'Shared encore · private acknowledgment',cost:'Tomorrow’s statement still needs both their approval. Tonight’s images may already tell a simpler story.',intro:'We wrote this one together. Nora, this song has your name on it as much as mine.',terms:['Lia acknowledges before singing that Nora is not on the next tour.','Shared credit, no invented continuity and agreed physical space onstage.','Both approve tomorrow’s statement before either publishes it.'],image:'ending-duet'}
};
