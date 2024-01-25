let localvideo=document.getElementById("localvideo");
let remotevideo=document.getElementById("remotevideo");
let joinbtn=document.getElementById("goroom");
let roomname=document.getElementById("roomnum");
let username=document.getElementById("username");
let divselectroom=document.getElementById("selectRoom");
let divconsultroom=document.getElementById("consultroom");
let chatin=document.getElementById("chatin");
let box=document.getElementById("showmsg");
let localstream,remotestream,rtcpeerconnection,iscaller;
let sendbtn=document.getElementById("sendbtn");
let chatarea=document.getElementById("chatarea");
let personame1=document.getElementById("personame1");

let schannel,rchannel;

const iceServers={
    'iceServer':[
        {'urls':'stun:stun.services.mozilla.com'},
        {'urls':'stun:stun.l.google.com:19302'}
    ]
}

var socket=io();
const constraints = {
    'video': true,
    'audio': true
}

joinbtn.onclick=()=>{
    roomname=roomname.value;
    username=username.value;
    personame1.innerHTML+=username;
    if(roomname){
        socket.emit('create or join',roomname);
        divselectroom.style="display:none"
        divconsultroom.style="display:block"

    }else{
        alert("Please enter all");
    }
};

socket.on('created',(room)=>{
  
    navigator.mediaDevices.getUserMedia(constraints).then((stream)=>{
        localstream=stream;
        localvideo.srcObject=stream;
        iscaller=true;
    }).catch((err)=>{
        console.log(err);
    });
});


sendbtn.onclick=()=>{
    chatarea.innerHTML+="<div style='margin-top:2px; margin-bottom:2px;'><b>Me: "+chatin.value+"</div>";    
    if(schannel.readyState==="open"){
        schannel.send(chatin.value);
    }else if(rchannel.readyState==="open"){
        console.log("rec side")
        rchannel.send(chatin.value);
    }
    
}

socket.on('joined',(room)=>{
    navigator.mediaDevices.getUserMedia(constraints).then((stream)=>{
        localstream=stream;
        localvideo.srcObject=stream;
        socket.emit('ready',room);
    }).catch((err)=>{
        console.log(err);
    });
});

//when  second users join and notify other that i am ready for signalling exchange process
socket.on('ready',()=>{
    if(iscaller){
        console.log("caller ready");
        rtcpeerconnection=new RTCPeerConnection(iceServers);
        rtcpeerconnection.onicecandidate=onIceCandidateFxn;
        ///////////////////
        // channel=rtcpeerconnection.createDataChannel(roomname);
        // channel.onerror=(e)=>{
        //  console.log("error creating");
        // } 
        // channel.onopen=(e)=>{
        //  console.log("channel opened on sender");
        //  var readystate=channel.readyState;
        //  if(readystate==="open"){
        //     console.log("message from channel")
        //  }else{
        //     console.log("close channel");
        //  }
        // }
        
        schannel=rtcpeerconnection.createDataChannel("chatting");
        rtcpeerconnection.ondatachannel=(e)=>{
            rchannel=e.channel;
            rchannel.onmessage=(msg)=>{
                chatarea.innerHTML+="<div style='margin-top:2px; margin-bottom:2px;'><b>Stranger: "+msg.data+"</div>";
            }
        }
         ///////////////////////
        
        rtcpeerconnection.ontrack=addStream;
        rtcpeerconnection.addTrack(localstream.getTracks()[0],localstream);
        rtcpeerconnection.addTrack(localstream.getTracks()[1],localstream)
        rtcpeerconnection.createOffer()
        .then((offer)=>{
                rtcpeerconnection.setLocalDescription(offer);
                socket.emit('offer',{
                    type:'offer',
                    sdp:offer,
                    room:roomname
                });
        })
        .catch(err=>{
            console.log(err);
        });

    }else{

    }
}
);

socket.on('offer',(event)=>{
    if(!iscaller){
        rtcpeerconnection=new RTCPeerConnection(iceServers);
        rtcpeerconnection.onicecandidate=onIceCandidateFxn;
        ///////////////////
        // rtcpeerconnection.ondatachannel=(e)=>{
        //     channel=e.channel;
        //     channel.onopen=(e)=>{
        //         console.log("channel opened on receiver");
        //     } 
        //     channel.onmessage=(e)=>{
        //         console.log(e.data);
        //         box.innerHTML=e.data;
        //     }
        // }

        schannel=rtcpeerconnection.createDataChannel("chatting");
        rtcpeerconnection.ondatachannel=(e)=>{
            rchannel=e.channel;
            rchannel.onmessage=(msg)=>{
                chatarea.innerHTML+="<div style='margin-top:2px; margin-bottom:2px;'><b>Stranger:"+msg.data+"</div>";
            }
        }


///////////////////////////
        rtcpeerconnection.ontrack=addStream;
        rtcpeerconnection.addTrack(localstream.getTracks()[0],localstream);
        rtcpeerconnection.addTrack(localstream.getTracks()[1],localstream)
        rtcpeerconnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcpeerconnection.createAnswer()
        .then((answer)=>{
                rtcpeerconnection.setLocalDescription(answer);
                socket.emit('answer',{
                    type:'answer',
                    sdp:answer,
                    room:roomname
                });
        })
        .catch(err=>{
            console.log(err);
        });

       


    }else{

    }
});

socket.on('answer',(event)=>{
   
rtcpeerconnection.setRemoteDescription(new RTCSessionDescription(event));
        
})


function addStream(event){    remotevideo.srcObject=event.streams[0];
    remotestream=event.streams[0];
}

function onIceCandidateFxn(event){
    //sending the generated ice candidates which will be received later by some
    if(event.candidate){
        socket.emit('candidate',{
            type:'candidate',
            label:event.candidate.sdpMLineIndex,
            id:event.candidate.sdpMid,
            candidate:event.candidate.candidate,
            room:roomname
        })
    }
}

//receiving the sent ice candidates by other user
socket.on('candidate',(event)=>{
    const candidate=new RTCIceCandidate({
        sdpMLineIndex:event.label,
        candidate:event.candidate
    });
    //adding the ice in rtcpeerconnection
    rtcpeerconnection.addIceCandidate(candidate);
});


    
