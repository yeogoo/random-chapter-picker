const globalFunctions = {

    async getChapter() {
        try {
            const res = await fetch("/api/random-chapter");
            const data = await res.json();
            const chapterElement = document.getElementById("chapter");
            const chapter = data.chapter;
            chapterElement.dataset.id = data.chapter.id;
            chapterElement.innerText =
                `${chapter.subject}-${chapter.chapter_no}: ${chapter.title} (${chapter.book_type})`;
        } catch (error) {
            console.error("API 요청 실패:", error);
            document.getElementById("chapter").innerText = "데이터를 불러올 수 없습니다.";
        }
    },

    async addChapter(event) {
        event.preventDefault();
    
        const subject = document.getElementById("subjectInput").value.trim();
        const chapter_no = document.getElementById("chapterNoInput").value.trim();
        const title = document.getElementById("titleInput").value.trim();
        const book_type = document.getElementById("book_type").value.trim();
    
        if (!subject || !chapter_no || !title || chapter_no <= 0 || !book_type) {
            alert("모든 필드를 올바르게 입력하세요.");
            return;
        }
    
        try {
            const res = await fetch("/api/add-chapter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, chapter_no, title, book_type }),
            });
    
            const data = await res.json();
            if (res.ok) {
                alert("새로운 챕터가 추가되었습니다!");
                document.getElementById("subjectInput").value = "";
                document.getElementById("chapterNoInput").value = "";
                document.getElementById("titleInput").value = "";
            } else {
                alert("챕터 추가 실패: " + data.error);
            }
        } catch (error) {
            console.error("챕터 추가 중 오류 발생:", error);
            alert("서버 오류로 챕터를 추가할 수 없습니다.");
        }
    },
    async markAsStudied() {        
        const chapterId = document.getElementById("chapter").dataset.id;
        if (!chapterId) return alert("선택된 챕터가 없습니다.");

        try {
            const res = await fetch("/api/mark-as-studied", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: chapterId }),
            });
            const data = await res.json();
            alert(data.message);
            getChapter(); // 📌 학습 완료 후 새로운 챕터 가져오기
        } catch (error) {
            console.error("학습 완료 실패:", error);
        }
    },
    async loadChapters() {
        try {
            const res = await fetch("/api/chapters");
            const data = await res.json();
    
            const chapterList = document.getElementById("chapterList");
            chapterList.innerHTML = ""; // 기존 목록 초기화
            
            data.chapters.forEach(chapter => {
                const row = document.createElement("tr");
    
                let reviewCount = chapter.review_count;
                let bgColor = reviewCount === 0 ? "bg-gray-50" : `bg-blue-${Math.min(100 + reviewCount * 100, 900)}`;
                row.classList.add(bgColor, "text-gray-800");
    
                // const subjectCell = document.createElement("td");
                // subjectCell.innerText = chapter.subject;
                // subjectCell.classList.add("p-4", "border");
                // row.appendChild(subjectCell);

                const subjectCell = document.createElement("td");
                subjectCell.classList.add("p-4", "border");

                const fullSubject = document.createElement("span");
                fullSubject.innerText = chapter.subject;
                fullSubject.classList.add("hidden", "sm:inline"); // sm 이상에서 표시

                const shortSubject = document.createElement("span");
                shortSubject.innerText = chapter.subject.slice(0, 2);
                shortSubject.classList.add("inline", "sm:hidden"); // sm 이하에서 표시

                subjectCell.appendChild(fullSubject);
                subjectCell.appendChild(shortSubject);
                row.appendChild(subjectCell);
    
                const chapterNoCell = document.createElement("td");
                chapterNoCell.innerText = chapter.chapter_no;
                chapterNoCell.classList.add("p-4", "border", "hidden", "sm:table-cell");
                row.appendChild(chapterNoCell);
    
                const titleCell = document.createElement("td");
                titleCell.innerText = chapter.title;
                titleCell.classList.add("p-4", "border");
                row.appendChild(titleCell);
    
                // const bookTypeCell = document.createElement("td");
                // bookTypeCell.innerText = chapter.book_type;
                // bookTypeCell.classList.add("p-4", "border");
                // row.appendChild(bookTypeCell);
                    // 유형 (기본서 → 기)
                const bookTypeCell = document.createElement("td");
                bookTypeCell.classList.add("p-4", "border");

                const fullBookType = document.createElement("span");
                fullBookType.innerText = chapter.book_type;
                fullBookType.classList.add("hidden", "sm:inline"); // sm 이상에서 표시

                // const shortBookType = document.createElement("span");
                // shortBookType.innerText = chapter.book_type.charAt(0);
                // shortBookType.classList.add("inline", "sm:hidden"); // sm 이하에서 표시
                
                const shortBookType = document.createElement("span");
                shortBookType.innerText = chapter.book_type.charAt(0);
                shortBookType.classList.add(
                    "inline", "sm:hidden", "px-2", "py-1", "text-xs", "font-semibold", 
                    "rounded-full", "bg-blue-100", "text-blue-600"
                ); // sm 이하에서 배경 + 둥근 라벨 스타일 적용
                bookTypeCell.appendChild(fullBookType);
                bookTypeCell.appendChild(shortBookType);
                row.appendChild(bookTypeCell);
    
                const reviewCountCell = document.createElement("td");
                reviewCountCell.innerText = chapter.review_count;
                reviewCountCell.classList.add("p-4", "border", "hidden", "sm:table-cell");
                row.appendChild(reviewCountCell);
    
                const lastReviewedCell = document.createElement("td");
                lastReviewedCell.innerText = chapter.last_reviewed ? new Date(chapter.last_reviewed).toLocaleDateString() : "-";
                lastReviewedCell.classList.add("p-4", "border", "hidden", "sm:table-cell");
                row.appendChild(lastReviewedCell);
    
                chapterList.appendChild(row);
            });
    
        } catch (error) {
            console.error("챕터 목록 불러오기 실패:", error);
        }
    }
}
// 📌 window 객체에 모든 함수를 자동 등록
Object.keys(globalFunctions).forEach(fnName => {
    window[fnName] = globalFunctions[fnName];
});
document.getElementById("addChapterForm").addEventListener("submit", addChapter);    
document.getElementById("refreshButton").addEventListener("click", loadChapters);

globalFunctions.getChapter(); // 페이지 로드 시 챕터 가져오기
globalFunctions.loadChapters();