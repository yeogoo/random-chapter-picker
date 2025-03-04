// const {onSchedule} = require("firebase-functions/v2/scheduler");
const express = require("express");
const axios = require("axios");

const app = express();
const HOST = "0.0.0.0";
const PORT = 33000;

// const KAKAO_CLIENT_ID = "YOUR_REST_API_KEY";
// const KAKAO_CLIENT_SECRET = "YOUR_CLIENT_SECRET";
// const KAKAO_REFRESH_TOKEN = "YOUR_REFRESH_TOKEN";

let accessToken = "YOUR_ACCESS_TOKEN"; // 초기 Access Token

// Access Token 갱신 함수
async function refreshAccessToken() {
  try {
    const response = await axios.post("https://kauth.kakao.com/oauth/token", null, {
      params: {
        grant_type: "refresh_token",
        client_id: "a853f794eb3b75a55ada21b127c57055",
        client_secret: "7JV4dL6oCEU6z3guAZuWrHaY8isquQaU",
        refresh_token: "KRr6FYx54JYcbT34OXG2PHDFMWgxRMD7AAAAAgoqJVMAAAGVS23JhOQ1KlcE_6bt",
      },
    });

    accessToken = response.data.access_token; // 새로운 Access Token 저장
    console.log("새로운 Access Token:", accessToken);
    return accessToken;
  } catch (error) {
    console.error("Access Token 갱신 실패:", error.response.data);
    throw error;
  }
}

// 카카오톡 메시지 전송 함수
async function sendKakaoMessage() {
  try {
    const chapterResponse = await fetch("http://localhost:8080/api/random-chapter");
    const chapterData = await chapterResponse.json();

    if (!chapterData.chapter) {
      console.error("챕터 데이터를 불러오지 못했습니다.");
      console.error("챕터를 가져오는 데 실패했습니다.");
      return;
    }

    const chapter = chapterData.chapter;

    // 2️⃣ 메시지 생성
    const message = {
      object_type: "text",
      text: `📖 오늘의 랜덤 공부 챕터!\n${chapter.subject} - ${chapter.chapter_no}: ${chapter.title}\n(${chapter.book_type})`,
      link: {web_url: "https://your-study-url.com"},
      buttons: [
        {
          title: "📖 챕터 보기",
          link: {web_url: `https://your-study-url.com/chapter/${chapter.chapter_no}`},
        },
        {
          title: "✅ 공부 완료",
          link: {web_url: "http://http://183.111.181.133:8080/"},
        },
      ],
    };

    console.log(message);

    const response = await axios.post("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
      template_object: JSON.stringify(message),
    }, {
      headers: {"Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded", // 📌 올바른 Content-Type
      },
    });

    console.log("카카오톡 메시지 전송 성공:", response.data);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log("Access Token 만료, 갱신 중...");
      await refreshAccessToken();
      return sendKakaoMessage(); // 다시 시도
    }
    console.error("카카오톡 메시지 전송 실패:", error.response.data);
  }
}

app.get("/", (req, res)=> {
  res.send("Hello, World");
});

// Express 서버 API
app.get("/send-message", async (req, res) => {
  try {
    const result = await sendKakaoMessage();
    res.json({success: true, data: result});
  } catch (error) {
    res.status(500).json({success: false, error: error.message});
  }
});

app.get("/refresh-token", async (req, res) => {
  try {
    const newToken = await refreshAccessToken();
    res.json({success: true, accessToken: newToken});
  } catch (error) {
    res.status(500).json({success: false, error: error.message});
  }
});

app.listen(PORT, HOST, () => {
  console.log(`서버 실행 중: http://${HOST}:${PORT}`);
});

