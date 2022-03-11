$("#typetext").keypress((e) => {
  if (e.keyCode !== 13) return;
  if ($("#typetext").val() === "") return;
  socket.emit("data", {header:header(cmsp.client.userId, cmsp.client.room, cmsp.client.type, cmsp.client.mode, "chat", ""), body:{media:{type:"dialog", dialog:{messages:[{type:"text", text:$("#typetext").val()}]}}}});
  $("#typetext").val("");
  return false;
});

$("#chat-send").click(() => {
  if ($("#typetext").val() === "") return;
  socket.emit("data", {header:header(cmsp.client.userId, cmsp.client.room, cmsp.client.type, cmsp.client.mode, "chat", ""), body:{media:{type:"dialog", dialog:{messages:[{type:"text", text:$("#typetext").val()}]}}}});
  $("#typetext").val("");
});

$("#chat-menu1").click(() => {
  socket.emit("data", {header:header(cmsp.client.userId, cmsp.client.room, cmsp.client.type, cmsp.client.mode, "chat", "customer"), body:{media:{type:"dialog", dialog:{messages:[{type:"image", url:"images/ic_smile_200.png"}]}}}});
  $("#chat-menu").hide();
});

$("#chat-menu2").click(() => {
  socket.emit("data", {header:header(cmsp.client.userId, cmsp.client.room, cmsp.client.type, cmsp.client.mode, "chat", "customer"), body:{media:{type:"dialog", dialog:{messages:[{type:"image", url:"images/ic_normal_200.png"}]}}}});
  $("#chat-menu").hide();
});

$("#chat-menu3").click(() => {
  socket.emit("data", {header:header(cmsp.client.userId, cmsp.client.room, cmsp.client.type, cmsp.client.mode, "chat", "customer"), body:{media:{type:"dialog", dialog:{messages:[{type:"image", url:"images/ic_depress_200.png"}]}}}});
  $("#chat-menu").hide();
});

const append_chat_messages = (message)=> {
	if (message.body.media.type === "dialog" && !message.body.media.dialog) return;
    const datetime = (message.header.ticker ? `${message.header.ticker.substr(11, 5)}` : `${('0' + (new Date()).getHours()).slice(-2)}:${('0' + (new Date()).getMinutes()).slice(-2)}`);
    const who = (message.header.type === "bot" ?  `<i class="neo-icon-bot" style="font-size:30px;color:red;"></i>` :
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
    $("#chat-talk").animate({scrollTop:$("#chat-talk")[0].scrollHeight}, "normal");
}

