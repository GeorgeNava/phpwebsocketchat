/******************** MAIN ********************/
const LOGTYPE={INFO:0,SYSTEM:1,ERROR:2};
var self,config,socket,users={};

self  ={nick:'',pic:myavatar};
config={
  host    :"ws://127.0.0.1:12345/phpwebsocketchat/server.php",
  gravatar:"http://www.gravatar.com/avatar/{0}?s=32&d=monsterid",
  system32:"system.png",
  error32 :"error.png"
};

function init(){
  $("#msg").focus();
  getusernick();
  startwebsocket();
  //loadhistory();
  window.onunload=onexit;
}
function getusernick(){
  var nick = prompt("Enter your nick: ");
  if(nick){ nick=nick.replace(new RegExp("[\'\"\\|\&]","g"),""); }
  else{ nick="Guest"+(new Date().getTime().toString().substr(8,5)); }
  self.nick=nick;
}
function startwebsocket(){
  try{
    socket = new WebSocket(config.host);
    socket.onopen    = function(evt){ welcome(); };
    socket.onmessage = function(evt){ process(evt.data); };
    socket.onclose   = function(evt){ goodbye(); };
  }
  catch(ex){ log('Error',ex,LOGTYPE.ERROR); }
}
function welcome(){
  sayhello();
  adduser(self);
  addselftoroster(self);
  setselfpic(self);
}
function goodbye(){
  log('Error','Disconnected!',LOGTYPE.ERROR);
  // say bye to server
  // remove self from roster
  // log self left room
}
function process(msg){
  var parts,action;
  parts  = msg.trim().split("|");
  action = parts[0];
  switch(action){
    case 'HELO': userhello(parts);   break;
    case 'LIST': userlist(parts);    break;
    case 'CHAT': userchat(parts);    break;
    case 'PRIV': userprivate(parts); break;
    case 'EXIT': usergoodbye(parts); break;
    case 'FAIL': showerror(parts);   break;
    default    : unknown(parts);     break;
  }
}
function onsend(){
  var txt,msg;
  txt = $("#msg");
  msg = txt.val();
  if(!msg){ return; }
  log(self.nick,msg); 
  msg=cleanmessage(msg);
  msg=setmessage("CHAT",self.nick,msg);
  txt.val("");
  txt.focus();
  send(msg);
}
function send(msg){
  try{ socket.send(msg); }
  catch(ex){ log('Error',ex,LOGTYPE.ERROR); }
}
function setmessage(){
  parts=[];
  for(i in arguments){ parts.push(arguments[i]); }
  return parts.join("|");
}
function cleanmessage(msg){
  return msg.replace("|",":");
}
function onexit(){
  var msg=setmessage("EXIT",self.nick);
  try{ socket.send(msg); } catch(ex){}
  socket.close();
  socket=null;
}

/******************** VISUALS ********************/
function log(nick,msg,type){
  var div,dl,time,pic,avatar;
  time   = now();
  type   = type||LOGTYPE.INFO;
  avatar = type==LOGTYPE.INFO?config.gravatar.parse(users[nick].pic):'';
  pic    = [avatar,config.system32,config.error32][type];
  nick   = [nick,'System','Error'][type];
  // TODO: sanitize msg, inject emoticons, pics, videos, links
  msg    = sanitize(msg);
  dl     = "<dl><dt><img src='{0}'/></dt><dd>{1}<br/><sub><b>{2}</b> at {3}</sub></dd></dl>".parse(pic,msg,nick,time);
  $("#log").prepend(dl);
}
function loghist(nick,time,pic,msg){
  var div,dl;
  pic=config.gravatar.parse(pic);
  dl = "<dl><dt><img src='{0}'/></dt><dd>{1}<br/><sub><b>{2}</b> at {3}</sub></dd></dl>".parse(pic,msg,nick,time);
  $("#log").prepend(dl);
}
function addtoroster(user){
  var li,pic;
  pic=config.gravatar.parse(user.pic);
  li ="<li id='{0}'><a href='#{1}'><img src='{2}'/><h3>{1}</h3><h4></h4></a></li>".parse(user.nick.toLowerCase(),user.nick,pic);
  $("#roster").append(li);
}
function addselftoroster(user){
  var li,pic;
  pic=config.gravatar.parse(user.pic);
  li ="<li id='{0}' class='self'><a href='#{1}'><img src='{2}'/><h3>{1}</h3><h4></h4></a></li>".parse(user.nick.toLowerCase(),user.nick,pic);
  $("#roster").append(li);
}
function addtorostersort(user){
  var li,pic,lnick,ok;
  lnick=user.nick.toLowerCase()
  pic  =config.gravatar.parse(user.pic);
  li   ="<li id='{0}'><a href='#{1}'><img src='{2}'/><h3>{3}</h3><h4></h4></a></li>".parse(lnick,user.nick,pic,user.nick);
  $("#roster li").each(function(){ 
    if(!ok && this.id==lnick){ ok=true; return false; } 
    if(!ok && this.id>lnick){ $(this).before(li); ok=true; return false; }
  });
  if(!ok){ $("#roster").append(li); }
}
function removefromroster(nick){
  $("#"+nick.toLowerCase()).remove();
}
function setselfpic(user){
  var pic=config.gravatar.parse(user.pic);
  $("#pic").attr({src:pic});
  self.pic=pic;
}
function loadhistory(){
  var today,dd,mm,yy,file;
  today=new Date();
  dd=today.getDate();    if(dd<10){ dd="0"+dd; }
  mm=today.getMonth()+1; if(mm<10){ mm="0"+mm; }
  yy=today.getFullYear();
  file=config.history+yy+mm+dd+".txt";
  ajax(file,null,onhistory);
}
function onhistory(data){
  var i,hist;
  hist = JSON.parse("["+data+"]");
  for(i=0;i<hist.length;i++){ loghist(hist[i][0],hist[i][1],hist[i][2],hist[i][3]); }
}
/******************** ACTIONS ********************/
function sayhello(){
  var msg=setmessage("HELO",self.nick,self.pic);
  send(msg); 
}
function saygoodbye(){
  var msg=setmessage("QUIT",self.nick);
  send(msg); 
}
function userhello(parts){
  var user = newuser(parts[1],parts[2]);
  adduser(user);
  addtorostersort(user);
  log(user.nick,"<i>"+user.nick+" entered the lobby...</i>"); 
}
function userlist(parts){
  var list = parts.slice(1);
  for(i in list){
    item=list[i].split(":");
    user=newuser(item[0],item[1]);
    adduser(user);
    addtorostersort(user);
  }
}
function userchat(parts){
  log(parts[1],parts[2]);
}

function userprivate(parts){
  // TODO:
}
function usergoodbye(parts){
  var nick=parts[1];
  log(nick,'<i>'+nick+' left the room...</i>');
  removefromroster(nick);
  deluser(nick);
}
function showerror(parts){
  log('Error',parts,LOGTYPE.ERROR); 
}
function unknown(parts){
  log('Error',parts,LOGTYPE.ERROR); 
}

/******************** UTILITIES ********************/
function onkey(event){ if(event.keyCode==13){ onsend(); } }
function unwrap(txt){ return txt.replace(new RegExp(String.fromCharCode(0),"g"),"").replace(new RegExp(String.fromCharCode(255),"g"),""); }
function hotlink2(txt){ return txt.replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,"<a href='$1'>$1</a>"); }
function newuser(nick,pic){ return {nick:nick,pic:pic}; }
function adduser(user){ users[user.nick]={nick:user.nick,pic:user.pic}; }
function deluser(nick){ delete users[nick]; }

function now(){
  var time,hh,mm,aa;
  time=new Date();
  aa="am";
  hh=time.getHours();   if(hh==0){ hh=12; }
  mm=time.getMinutes(); if(mm<10){ mm="0"+mm; }
  if(hh>12){hh=hh-12; aa="pm";}
  return hh+":"+mm+" "+aa;
}

function sanitize(txt){
  // string delimiter
  txt = txt.replace(/\"/g,'\"');
  // html entities
  // txt = txt.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  // hotlinks
  txt = txt.replace(/(ftp|http|https|file):\/\/[\S]+(\b|$)/gim,'<a href="$&" target="_blank">$&</a>')
           .replace(/([^\/])(www[\S]+(\b|$))/gim,'$1<a href="http://$2" target="_blank">$2</a>');
  return txt;
} 

function ajax(url,request,callback,target){
  var mode = request?"POST":"GET";
  var http = new XMLHttpRequest();
  http.open(mode,url,true);
  http.onerror=function(){callback("{'error':'Unknown error from server'}",target);}; 
  if(mode=="POST"){http.setRequestHeader('Content-Type','application/x-www-form-urlencoded');}
  http.onreadystatechange=function(){if(http.readyState==4){callback(http.responseText,target);}};
  if(request){ http.send(request); } else{ http.send(); }
}

String.prototype.trim=function(){ return this.replace(/^\s\s*/,'').replace(/\s\s*$/,'').replace(/^\0\0*/,''); }
String.prototype.parse=function(){ 
  var str=this;
  for(var i in arguments){
    str=str.replace(new RegExp("{("+i+")}","g"),arguments[i]); 
  }
  return str; 
}

/******************** END ********************/
