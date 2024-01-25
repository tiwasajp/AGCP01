const imagePad = {
	canvas: document.getElementById("imagePad"),
	context: document.getElementById("imagePad").getContext("2d"),
	src: null,
	rect: { left: 0, top: 0, width: 0, height: 0 },
};

document.getElementById("fileUpload").addEventListener("change", (e) => {
	if (e.target.files[0].type.match("image.*")) {
		imagePad.context.clearRect(0, 0, imagePad.canvas.width, imagePad.canvas.height);
		var image = new Image();
		image.src = window.URL.createObjectURL(e.target.files[0]);
		image.onload = () => {
			var width = image.width;
			var height = image.height;
			const max_image_width = 800;
			if (width > max_image_width) {
				width = max_image_width;
				height = image.height * (max_image_width / image.width);
			}
			imagePad.canvas.width = width;
			imagePad.canvas.height = height;
			console.log(`imagePad.canvas.width:${imagePad.canvas.width} imagePad.canvas.height:${imagePad.canvas.height}`);
			imagePad.canvas.getContext("2d").drawImage(image, 0, 0, imagePad.canvas.width, imagePad.canvas.height);
			socket.emit("data", {
				header: header(cmsp.client.userId, cmsp.client.room, cmsp.client.type, cmsp.client.mode, "chat", ""),
				body: { media: { type: "dialog", dialog: { messages: [{ type: "image", url: document.getElementById("imagePad").toDataURL() }] } } }
			});
		}
	}
});

$("#typetext").keypress((e) => {
	if (!(e.keyCode === 13 || e.keyCode === 229)) return;
	if ($("#typetext").val() === "") return;
	socket.emit("data", { header: header(cmsp.client.userId, cmsp.client.room, cmsp.client.type, cmsp.client.mode, "chat", ""), body: { media: { type: "dialog", dialog: { messages: [{ type: "text", text: $("#typetext").val() }] } } } });
	$("#typetext").val("");
	return false;
});

$("#chat-send").click(() => {
	if ($("#typetext").val() === "") return;
	socket.emit("data", { header: header(cmsp.client.userId, cmsp.client.room, cmsp.client.type, cmsp.client.mode, "chat", ""), body: { media: { type: "dialog", dialog: { messages: [{ type: "text", text: $("#typetext").val() }] } } } });
	$("#typetext").val("");
	return false;
});

$("#chat-funcs-btn").click(() => {
	$("#chat-text").hide();
	$("#chat-funcs").show();
});

$("#chat-funcs").click(() => {
	$("#chat-funcs").hide();
	$("#chat-text").show();
});


const append_chat_messages = (message) => {
	if (message.body.media.type === "dialog" && !message.body.media.dialog) return;
	const datetime = (message.header.ticker ? `${message.header.ticker.substr(11, 5)}` : `${('0' + (new Date()).getHours()).slice(-2)}:${('0' + (new Date()).getMinutes()).slice(-2)}`);
	const who = (message.header.type === "bot" ? `<i class="neo-icon-bot" style="font-size:30px;color:red;"></i>` :
		(message.header.type === "agent" ? `<i class="neo-icon-agents" style="font-size:30px;color:red;"></i>` :
			`<figure class="neo-avatar neo-avatar--small neo-avatar--small--generic" style="margin-top:5px;"></figure>`));
	var html = `<ul class="neo-group-list neo-group-list--hover"><li class="neo-group-list__wrapper"><div style="width:60px;"><div class="vertical"><p class="neo-body-small">${datetime}</p>${who}</div></div>`;
	html += `<div style="width:100%;">`;
	if (message.body.media.dialog) {
		for (var i in message.body.media.dialog.messages) {
			if (!message.body.media.dialog.messages[i].type) continue;
			switch (message.body.media.dialog.messages[i].type) {
				case "text":
					html += `<h4>${message.body.media.dialog.messages[i].text}</h4>`;
					break;
				case "url":
					html += `<span><iframe style='width:100%;height:350px;border:none;' src='${message.body.media.dialog.messages[i].url}'></iframe></span>`;
					break;
				case "image":
					if (message.body.media.dialog.messages[i].text) {
						html += `<span style='width:100%;'>${message.body.media.dialog.messages[i].text}</span>`;
					}
					if (message.body.media.dialog.messages[i].originalContentUrl) {
						html += `<img src='${message.body.media.dialog.messages[i].originalContentUrl}' class='chat-img-left'/>`;
					}
					if (message.body.media.dialog.messages[i].url) {
						html += `<img src='${message.body.media.dialog.messages[i].url}' style='width:100%;'/>`;
					}
					break;
			}
		}
	}
	html += `</div></li></ul>`;
	$("#chat-talk").append(html);
	$("#chat-talk").animate({ scrollTop: $("#chat-talk")[0].scrollHeight }, "normal");
}

