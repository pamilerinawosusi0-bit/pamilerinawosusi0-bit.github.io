const $ = s => document.querySelector(s);
const feed = $("#feed");
const stories = $("#stories");
let currentCommentPost = null;
let pendingMedia = null;

const defaultPosts = [
  {id:1,user:"Ayo",initial:"A",time:"2h",text:"Just enjoying the day ✨",media:null,likes:128,liked:false,bookmarked:false,comments:[{user:"Mia",text:"Clean vibe 🔥"}]},
  {id:2,user:"Mia",initial:"M",time:"5h",text:"New day, new energy.",media:"https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",mediaType:"image",likes:341,liked:false,bookmarked:false,comments:[]},
  {id:3,user:"Jay",initial:"J",time:"1d",text:"What's everybody listening to today?",media:null,likes:72,liked:false,bookmarked:false,comments:[]}
];

let posts = JSON.parse(localStorage.getItem("naive_posts") || "null") || defaultPosts;
const save = () => localStorage.setItem("naive_posts", JSON.stringify(posts));

function esc(s){
  return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),1800);
}
function renderStories(){
  const names=["Your story","Aisha","David","Tobi","Maya","Chris","Zara"];
  stories.innerHTML=names.map((n,i)=>`<div class="story"><div class="story-avatar"><div>${i===0?"+":esc(n[0])}</div></div>${esc(n)}</div>`).join("");
}
function renderFeed(){
  feed.innerHTML = posts.map(p=>`
    <article class="post" data-id="${p.id}">
      <div class="post-head">
        <div class="post-avatar">${esc(p.initial)}</div>
        <div><div class="post-user">${esc(p.user)}</div><div class="post-time">${esc(p.time)}</div></div>
        <button class="more" aria-label="More">•••</button>
      </div>
      ${p.text ? `<div class="post-text">${esc(p.text)}</div>` : ""}
      ${p.media ? (p.mediaType==="video"
        ? `<video class="post-media" src="${p.media}" controls playsinline></video>`
        : `<img class="post-media" src="${p.media}" alt="Post media">`) : ""}
      <div class="post-actions">
        <button class="action ${p.liked?"liked":"" }" data-action="like">♡<span>${p.likes}</span></button>
        <button class="action" data-action="comment">◯<span>${p.comments.length}</span></button>
        <button class="action" data-action="share">↗</button>
        <button class="action ${p.bookmarked?"bookmarked":"" }" data-action="save" style="margin-left:auto">🔖</button>
      </div>
      <div class="post-info">
        <div class="likes">${p.likes.toLocaleString()} likes</div>
        <div class="caption"><b>${esc(p.user)}</b>${esc(p.text||"")}</div>
        ${p.comments.length ? `<button class="view-comments" data-action="comment">View all ${p.comments.length} comments</button>` : ""}
      </div>
    </article>`).join("");
}
function openPostModal(){
  $("#postModal").classList.remove("hidden"); $("#postText").focus();
}
function closePostModal(){
  $("#postModal").classList.add("hidden"); $("#postText").value="";
  $("#mediaPreview").innerHTML=""; $("#mediaPreview").classList.add("hidden"); pendingMedia=null; $("#mediaInput").value="";
}
function openComments(id){
  currentCommentPost=id;
  const p=posts.find(x=>x.id===id);
  $("#commentsList").innerHTML=p.comments.length ? p.comments.map(c=>`<div class="comment"><div class="comment-avatar">${esc(c.user[0])}</div><div><p><b>${esc(c.user)}</b> ${esc(c.text)}</p><small>Just now</small></div></div>`).join("") : `<div class="empty">No comments yet. Be the first.</div>`;
  $("#commentsModal").classList.remove("hidden");
}
feed.addEventListener("click",e=>{
  const btn=e.target.closest("[data-action]"); if(!btn)return;
  const postEl=btn.closest(".post"), id=Number(postEl.dataset.id), p=posts.find(x=>x.id===id);
  const a=btn.dataset.action;
  if(a==="like"){p.liked=!p.liked;p.likes+=p.liked?1:-1;save();renderFeed();}
  if(a==="save"){p.bookmarked=!p.bookmarked;save();renderFeed();toast(p.bookmarked?"Saved":"Removed from saved");}
  if(a==="comment")openComments(id);
  if(a==="share"){navigator.clipboard?.writeText(location.href).catch(()=>{});toast("Post link copied");}
});
$("#openComposer").onclick=openPostModal; $("#navCreate").onclick=openPostModal; $("#quickMedia").onclick=openPostModal;
$("#closeModal").onclick=closePostModal;
$("#postModal").addEventListener("click",e=>{if(e.target.id==="postModal")closePostModal()});
$("#closeComments").onclick=()=>$("#commentsModal").classList.add("hidden");
$("#mediaInput").addEventListener("change",e=>{
  const file=e.target.files[0]; if(!file)return;
  if(file.size>15*1024*1024){toast("Use a file under 15MB");e.target.value="";return;}
  const reader=new FileReader();
  reader.onload=()=>{pendingMedia={data:reader.result,type:file.type.startsWith("video/")?"video":"image"};const box=$("#mediaPreview");box.classList.remove("hidden");box.innerHTML=pendingMedia.type==="video"?`<video src="${pendingMedia.data}" controls></video>`:`<img src="${pendingMedia.data}" alt="Preview">`;}
  reader.readAsDataURL(file);
});
$("#publishBtn").onclick=()=>{
  const text=$("#postText").value.trim();
  if(!text && !pendingMedia){toast("Add text or a photo/video");return;}
  posts.unshift({id:Date.now(),user:"You",initial:"P",time:"now",text,media:pendingMedia?.data||null,mediaType:pendingMedia?.type||null,likes:0,liked:false,bookmarked:false,comments:[]});
  save();renderFeed();closePostModal();toast("Posted successfully");
};
$("#sendComment").onclick=()=>{
  const input=$("#commentInput"), text=input.value.trim(); if(!text||currentCommentPost===null)return;
  const p=posts.find(x=>x.id===currentCommentPost);p.comments.push({user:"You",text});
  input.value="";save();openComments(currentCommentPost);renderFeed();
};
$("#commentInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("#sendComment").click()});
$("#emojiBtn").onclick=()=>$("#postText").setRangeText(" ❤️ ✨ 🔥 ",$("#postText").selectionStart,$("#postText").selectionEnd,"end");
$("#searchBtn").onclick=()=>toast("Search UI is ready for the next upgrade");
$("#messagesBtn").onclick=()=>toast("Messages UI is ready for the next upgrade");
document.querySelectorAll(".nav-item[data-tab]").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));b.classList.add("active");
  if(b.dataset.tab==="profile")toast("Profile page coming next");
  if(b.dataset.tab==="explore")toast("Explore page coming next");
  if(b.dataset.tab==="notifications")toast("No new notifications");
});
renderStories();renderFeed();