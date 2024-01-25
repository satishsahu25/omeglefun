const express=require('express');
const app = express();
const http = require("http").createServer(app);
const io=require('socket.io')(http);

const port=5000;
app.use(express.static("public"));


io.on('connection', socket=>{

    socket.on('create or join',(room)=>{
           const myroom=io.sockets.adapter.rooms[room]||{length:0};
           const numusers=myroom.length;
           console.log("create or join")
            // console.log(io.sockets.adapter.rooms[room])
           if(numusers==0){
            socket.join(room);
            socket.emit('created',room);
            
           }else{
            socket.join(room);
            socket.emit('joined',room);
           }
    })

    socket.on('ready',(room)=>{
        socket.broadcast.to(room).emit('ready');
    });    
    socket.on('candidate',(event)=>{
        socket.broadcast.to(event.room).emit('candidate',event);
    });    
    socket.on('offer',(event)=>{
        socket.broadcast.to(event.room).emit('offer',event.sdp);
    });
    socket.on('answer',event=>{
        socket.broadcast.to(event.room).emit('answer',event.sdp);
   
    })

})




http.listen(port,()=>{
    console.log(`listening on ${port}`)
});
