const judgeGameUrl = `http://localhost:8080/judgeName`;
const result =  fetch(judgeGameUrl, {
    method: 'POST',
    body: "laiyunpeng",
    headers: {
        "content-type": "application/json",
    }
});