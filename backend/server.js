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

// 랜덤 챕터 API
app.get("/api/random-chapter", async (req, res) => {
    const { data, error } = await supabase
        .from("min_review_count_chapters")
        .select("*")
        .order("last_reviewed", { ascending: true }) // 📌 동일한 경우, 가장 오래된 학습 챕터 선택
        ;

    if (error) return res.status(500).json({ error: error.message });
    const randomChapter = data[Math.floor(Math.random() * data.length)];

    res.json({ chapter: randomChapter });
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
        .order("id", { ascending: true }) // 📌 회독수가 적은 챕터 우선 선택
        .order("last_reviewed", { ascending: true }) // 📌 동일한 경우, 가장 오래된 학습 챕터 선택
        ;

    // if (error) return res.status(500).json({ error: error.message });
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json({ chapters: data });
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

const PORT = process.env.PORT || 33000;
app.listen(PORT, () => console.log(`✅ 서버 실행: http://0.0.0.0:${PORT}`));
