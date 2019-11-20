var Peer = require('simple-peer')
let socket = io();

socket.on('connect', function() {

    function InitPeer(init=false,stream=null) {
        let peer = new Peer({initiator: init,stream:stream,trickle: false,reconnectTimer: 100,
            iceTransportPolicy: 'relay',
            config: {

                iceServers: [
                    {
                        urls: "stun:viralbot.ml",
                        username: "xxx",
                        credential: "xxx"
                    },
                    {
                        urls: "turn:viralbot.ml",
                        username: "xxx",
                        credential: "xxx"
                    }
                ]
            }});
        return peer;
    }

    function CreateVideo(stream) {
        let video = document.querySelector('video');
        video.srcObject = stream;
        video.play();
        return stream;
    }
    function InitiateBroadcaster() {

        let peers={};

        navigator.getUserMedia({video: true, audio: true}, gotMedia, (err) => {
            console.log(err);
        });

        socket.emit('broadcaster_found',{socketId:socket.io.engine.id});

        function gotMedia(stream) {
            stream = CreateVideo(stream);

            //STEP - 3
            function FrontOfferRequest(_data)
            {
                try {
                    _data = JSON.parse(_data);
                    let peer = InitPeer(true, stream);
                    peer.on('signal', data => {
                        console.log(data);
                        let _socketId = _data.socketId;
                        peers[_socketId] = peer;
                        socket.emit('back_offer', JSON.stringify({'data': data, 'socketId': _data.socketId}));
                    });
                    peer.on('connect', () => {
                        console.log('CONNECTED')
                    });
                    peer.on('error', (err) => {
                        console.log(err);
                    });

                    peer.on('close', function () {
                        peer.destroy();
                    });
                }catch (e) {
                    console.log(e);
                }
            }
            //STEP - 7
            function FrontAnswer(_data){
                try {
                    _data = JSON.parse(_data);
                    peers[_data.socketId].signal(_data.data);
                }catch (e) {
                    console.log(e);
                }
            }
            socket.on('front_offer_request',FrontOfferRequest);
            socket.on('front_answer',FrontAnswer);

        }
    }

    function InitiateReceiever() {
        // STEP - 1
        socket.emit('back_offer_request');

        let peer = new Peer();
        peer.on('signal', data => {
            console.log(data);

            socket.emit('back_answer',JSON.stringify({'data':data}));
        });
        peer.on('close', function () {
            peer.destroy();
        });
        peer.on('error', (err) => {
            console.log(err);
        });
        peer.on('stream', stream => {
            CreateVideo(stream);

        });

        // STEP - 5
        function FrontOffer(_data)
        {
            try {

                _data = JSON.parse(_data);
                peer.signal(_data.data);
            }catch (e) {
                console.log(e);
            }
        }
        socket.on('front_offer',FrontOffer);

    }
    location.hash === '#Broadcast' ? InitiateBroadcaster() : InitiateReceiever();


});