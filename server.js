// peer to peer single channel broadcast

const express = require('express');
const app  = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));
let broadcasterId=null;
io.on('connection',function (socket) {

    // Step - 4
    function BackOffer(_data){
        _data = JSON.parse(_data);
        socket.to(_data.socketId).emit("front_offer",JSON.stringify({'data':_data.data}));

    }
    // Step - 6
    function BackAnswer(_data) {
        _data = JSON.parse(_data);
        if(broadcasterId!==null)
            socket.to(broadcasterId).emit("front_answer", JSON.stringify({'socketId':socket.id,'data':_data.data}));
    }

    function BroadcasterFound(data) {
        broadcasterId = data.socketId;
    }
    // Step - 2
    function BackOfferRequest(data) {
        if(broadcasterId!==null)
            socket.to(broadcasterId).emit("front_offer_request",JSON.stringify( {'socketId':socket.id}));
    }

    // event executed when client sends message for an event
    socket.on('broadcaster_found',BroadcasterFound);
    socket.on('back_offer_request',BackOfferRequest);
    socket.on('back_offer',BackOffer);
    socket.on('back_answer',BackAnswer);

});

http.listen(port,()=>console.log(`active on ${port}`));
