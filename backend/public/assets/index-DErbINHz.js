(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const c of t.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&r(c)}).observe(document,{childList:!0,subtree:!0});function a(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function r(e){if(e.ep)return;e.ep=!0;const t=a(e);fetch(e.href,t)}})();const d={async getChapter(){try{const o=await(await fetch("/api/random-chapter")).json(),a=document.getElementById("chapter"),r=o.chapter;a.dataset.id=o.chapter.id,a.innerText=`${r.subject}-${r.chapter_no}: ${r.title} (${r.book_type})`}catch(n){console.error("API 요청 실패:",n),document.getElementById("chapter").innerText="데이터를 불러올 수 없습니다."}},async addChapter(n){n.preventDefault();const o=document.getElementById("subjectInput").value.trim(),a=document.getElementById("chapterNoInput").value.trim(),r=document.getElementById("titleInput").value.trim(),e=document.getElementById("book_type").value.trim();if(!o||!a||!r||a<=0||!e){alert("모든 필드를 올바르게 입력하세요.");return}try{const t=await fetch("/api/add-chapter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:o,chapter_no:a,title:r,book_type:e})}),c=await t.json();t.ok?(alert("새로운 챕터가 추가되었습니다!"),document.getElementById("subjectInput").value="",document.getElementById("chapterNoInput").value="",document.getElementById("titleInput").value=""):alert("챕터 추가 실패: "+c.error)}catch(t){console.error("챕터 추가 중 오류 발생:",t),alert("서버 오류로 챕터를 추가할 수 없습니다.")}},async markAsStudied(){const n=document.getElementById("chapter").dataset.id;if(!n)return alert("선택된 챕터가 없습니다.");try{const a=await(await fetch("/api/mark-as-studied",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:n})})).json()}catch(o){console.error("학습 완료 실패:",o)}},async loadChapters(){try{const o=await(await fetch("/api/chapters")).json(),a=document.getElementById("chapterList");a.innerHTML="",o.chapters.forEach(r=>{const e=document.createElement("tr");let t=r.review_count,c=t===0?"bg-gray-50":`bg-blue-${Math.min(100+t*100,900)}`;console.log(t,c),e.classList.add(c,"text-gray-800");const s=document.createElement("td");s.innerText=r.subject,s.classList.add("p-4","border"),e.appendChild(s);const i=document.createElement("td");i.innerText=r.chapter_no,i.classList.add("p-4","border"),e.appendChild(i);const l=document.createElement("td");l.innerText=r.title,l.classList.add("p-4","border"),e.appendChild(l);const p=document.createElement("td");p.innerText=r.book_type,p.classList.add("p-4","border"),e.appendChild(p);const u=document.createElement("td");u.innerText=r.review_count,u.classList.add("p-4","border"),e.appendChild(u);const m=document.createElement("td");m.innerText=r.last_reviewed?new Date(r.last_reviewed).toLocaleDateString():"-",m.classList.add("p-4","border"),e.appendChild(m),a.appendChild(e)})}catch(n){console.error("챕터 목록 불러오기 실패:",n)}}};Object.keys(d).forEach(n=>{window[n]=d[n]});document.getElementById("addChapterForm").addEventListener("submit",addChapter);document.getElementById("refreshButton").addEventListener("click",loadChapters);d.getChapter();d.loadChapters();
