// session.js
// Tomohiro Iwasa, Avaya Japan, 2017-2022
// Updated: 20220311

const socket = io.connect();

var Base64 = { encode: function(str) { return btoa(unescape(encodeURIComponent(str))); }, decode: function(str) { return decodeURIComponent(escape(atob(str))); } };

const cmsp = {
	"client": { clientId: "", userId: "", type: "", mode: "", password: "should_be_encrypted", room: "", linkState: false, data: [], attributes: {}, devices: [], }
};

const header = (userId, room, type, mode, channel, messageId) => {
	return { userId: userId, room: room, type: type, mode: mode, channel: channel, messageId: (!messageId ? messageId : Math.random().toString(16).slice(2)), ticker: (new Date()) };
}

var arg = new Object;
var pair = location.search.substring(1).split("&");
for (var i = 0; pair[i]; i++) {
	var keyValue = pair[i].split("=");
	arg[keyValue[0]] = keyValue[1];
}

cmsp.client.userId = `1000${('0' + (new Date()).getMinutes()).slice(-2)}${('0' + (new Date()).getSeconds()).slice(-2)}`;
cmsp.client.type = "customer";
cmsp.client.mode = "demo";
cmsp.client.room = cmsp.client.userId;

if (arg.CustomerId != null) {
	cmsp.client.userId = arg.CustomerId;
	cmsp.client.room = cmsp.client.userId;
}

console.log(`[INFO] cmsp.client.userId:${cmsp.client.userId}`);
console.log(`[INFO] cmsp.client.room:${cmsp.client.room}`);

if (!cmsp.client.userId) {
	alert("No userId identified.")
}

window.onload = () => {
	if (cmsp.client.userId) {
		socket.emit("session", { action: "join", userId: cmsp.client.userId, room: cmsp.client.room, type: cmsp.client.type, mode: cmsp.client.mode });
	}
};

window.onbeforeunload = (e) => {
	console.log("[INFO] window.onbeforeunload");
	socket.emit("session", { action: "leave", userId: cmsp.client.userId });
};


socket.on("session", (message) => {
	console.log(`[INFO] socket.on(session): ${JSON.stringify(message)}`);
	if (message.action === "join" && message.userId === cmsp.client.userId && message.type === cmsp.client.type) {
		;
	}
	else if (message.action === "leave") {
		;
	}
});

socket.on("data", (message) => {
	console.log(`[socket.on(data)] ${JSON.stringify(message)}`);
	if (message.body.media.type === "dialog") {
		if (!message.body.media.dialog) return;
		append_chat_messages(message);
	}
});







