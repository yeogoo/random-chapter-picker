require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());

// 📌 Supabase 연결 설정
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);


// 📌 정적 파일 서빙 (빌드된 프론트엔드)
app.use(express.static(path.join(__dirname, "public")));

// 📌 랜덤 챕터 가져오는 함수 (중복 제거)
async function getRandomChapter() {
    const { data, error } = await supabase
      .from("min_review_count_chapters")
      .select("*");
    
    if (error) throw new Error(error.message);
    if (data.length === 0) return null;
    
    const now = new Date();
    const scaleFactor = 7; // 가중치의 증가 속도를 조정 (예: 7일 기준)
    
    // 각 챕터에 대해 지수 가중치 계산: Math.exp(diffDays / scaleFactor)
    const chaptersWithWeights = data.map(chapter => {
      const lastReviewed = chapter.last_reviewed ? new Date(chapter.last_reviewed) : new Date(0);
      const diffDays = (now - lastReviewed) / (1000 * 60 * 60 * 24);
      const weight = Math.exp(diffDays / scaleFactor);
      return { ...chapter, weight };
    });
    
    // 모든 챕터의 총 가중치 계산
    const totalWeight = chaptersWithWeights.reduce((sum, chapter) => sum + chapter.weight, 0);
    console.log(chaptersWithWeights);
    let randomWeight = Math.random() * totalWeight;
    
    // 가중치 기반 랜덤 선택
    for (const chapter of chaptersWithWeights) {
      randomWeight -= chapter.weight;
      if (randomWeight <= 0) {
        return chapter;
      }
    }
    
    // 예외 처리: 마지막 챕터 반환
    return chaptersWithWeights[chaptersWithWeights.length - 1];
}

// 랜덤 챕터 API
app.get("/random-chapter", async (req, res) => {
    const randomChapter = await getRandomChapter();
    if (!randomChapter) return res.status(404).send("랜덤 챕터를 찾을 수 없습니다.");

    const htmlResponse = `
       <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>랜덤 챕터</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
            <div class="max-w-xl w-full mx-auto bg-white p-10 rounded-3xl shadow-xl border border-gray-200 text-center">
                <h1 class="text-3xl font-extrabold text-blue-700 mb-6">📚 랜덤 챕터</h1>
                <div class="mt-6 p-6 bg-blue-50 rounded-2xl shadow-md border border-blue-200">
                    <p class="text-xl text-gray-900 font-semibold">📖 ${randomChapter.subject} - ${randomChapter.chapter_no}장</p>
                    <p class="text-lg text-gray-700 mt-2">${randomChapter.title}</p>
                    <p class="text-sm text-gray-500 mt-4">회독수: ${randomChapter.review_count}</p>
                    <p class="text-sm text-gray-500">마지막 학습일: ${new Date(randomChapter.last_reviewed).toLocaleString("ko-KR")}</p>
                </div>
                <div class="mt-6 flex justify-center space-x-4">
                    <a href="/" class="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition">🏠 홈으로</a>
                    <a href="/random-chapter" class="px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition">🔄 다시 한번 더</a>
                </div>
            </div>
        </body>
        </html>
        `;

    res.status(200).send(htmlResponse);
});

app.get("/api/random-chapter", async (req, res) => {
    try {
        const randomChapter = await getRandomChapter();
        if (!randomChapter) return res.status(404).json({ error: "랜덤 챕터를 찾을 수 없습니다." });

        res.json({ chapter: randomChapter });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/subjects", async (req, res) => {
    const { data, error } = await supabase
        .from("chapters")
        .select("subject")
        .order("subject", { ascending: true }); // 📌 같은 과목 중 첫 번째만 선택
        // .distinct(); // 📌 중복 제거

    if (error) return res.status(500).json({ error: error.message });

    // const subjects = data.map(item => item.subject); // 📌 과목명만 추출
    const uniqueSubjects = [...new Set(data.map(item => item.subject))]; // 📌 JavaScript에서 중복 제거

    res.json({ subjects: uniqueSubjects });
});

// 📌 새로운 챕터 추가 API
app.post("/api/add-chapter", async (req, res) => {
    const { subject, chapter_no, title, book_type } = req.body;

    if (!subject || !chapter_no || !title || !book_type) {
        return res.status(400).json({ error: "모든 필드를 입력하세요." });
    }
    let review_count = 0
    const { data, error } = await supabase.from("chapters")
        .insert([
        { subject, chapter_no, title, book_type, review_count }
    ]).select("*");

    if (error) {
        if (error.message.includes("duplicate key value violates unique constraint")) {
            return res.status(409).json({ error: "이미 존재하는 챕터입니다!" });
        }
        console.error("❌ 데이터 삽입 실패:", error)
        return res.status(500).json({ error: error.message });
    }
    res.json({ message: "챕터 추가 성공!", chapter: data[0] });
});

app.get("/api/chapters", async (req, res) => {
    // const { data, error } = await supabase
    //     .from("chapters")
    //     .select("subject, chapter_no, title, book_type, review_count, last_reviewed")
    //     .order("subject", { ascending: true })
    //     .order("chapter_no", { ascending: true });

    const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .order("review_count", { ascending: true }) // 📌 회독수가 적은 챕터 우선 선택
        .order("last_reviewed", { ascending: true }) // 📌 동일한 경우, 가장 오래된 학습 챕터 선택
        .order("id", {ascending: true})
        ;

    // if (error) return res.status(500).json({ error: error.message });
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json({ chapters: data });
});

app.get("/mark-as-studied", async (req, res) => {
    const { chapterId } = req.query;
    console.log(chapterId);
    if (!chapterId) {
        return res.status(400).json({ error: "❌ 챕터 ID가 필요합니다." });
    }
    try {
        const response = await fetch("http://localhost:8080/api/mark-as-studied", { // 절대 경로 사용
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: chapterId }),
        });

        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);

        const chapter = data.updatedChapter;
        
        const htmlResponse = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>학습 완료</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
            <div class="max-w-xl w-full mx-auto bg-white p-10 rounded-3xl shadow-xl border border-gray-200 text-center">
                <h1 class="text-3xl font-extrabold text-blue-700 mb-6">✅ 학습 완료</h1>
                <p class="text-lg text-gray-800 font-semibold">${data.message}</p>
                <div class="mt-6 p-6 bg-blue-50 rounded-2xl shadow-md border border-blue-200">
                    <p class="text-xl text-gray-900 font-semibold">📖 ${chapter.subject} - ${chapter.chapter_no}장</p>
                    <p class="text-lg text-gray-700 mt-2">${chapter.title}</p>
                    <p class="text-sm text-gray-500 mt-4">회독수: ${chapter.review_count}</p>
                    <p class="text-sm text-gray-500">마지막 학습일: ${chapter.last_reviewed}</p>
                </div>
                <div class="mt-6">
                    <a href="/" class="px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition">🏠 홈으로</a>
                </div>
            </div>
        </body>
        </html>`;

        res.status(200).send(htmlResponse);

    } catch (error) {
        console.error("API 요청 중 오류 발생:", error);
        res.status(500).json({ error: "서버 내부 오류 발생" });
    }
});
  

app.post("/api/mark-as-studied", async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "챕터 ID가 필요합니다." });
    try {
        // 1. 현재 값 가져오기
        const { data: chapterData, error: fetchError }= await supabase
        .from("chapters")
        .select("review_count")
        .eq("id", id).single();

        if (fetchError) {
            throw fetchError;
        }
        console.log('조회된 데이터:', chapterData);

        // 2. 값 증가시키기
        const newReviewCount = chapterData.review_count + 1;
        
        console.log('newReviewCount:', newReviewCount);
        // 3. 업데이트하기
        const { data: updatedData, error: updateError } = await supabase
            .from("chapters")
            .update({ review_count: newReviewCount, last_reviewed: new Date() })
            .eq("id", id)
            .select();

        if (updateError) {
            throw updateError;
        }
    
        console.log('Review count updated successfully:', updatedData);
        if (updateError) return res.status(500).json({ error: updateError.message });
            res.json({ message: "챕터 학습 완료!", updatedChapter: updatedData[0] })
        ;
    } catch (error) {
        console.error('Error updating review count:', error.message);
    }
});


// 📌 프론트엔드 페이지 제공 (빌드된 index.html)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`✅ 서버 실행: http://0.0.0.0:${PORT}`));
